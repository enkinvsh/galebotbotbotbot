import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { validateInitData } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.use(validateInitData);
router.use(requireAdmin);

router.get('/bookings', async (req: Request, res: Response): Promise<void> => {
  const { date_from, date_to, exhibition_id, status } = req.query;

  try {
    let query = `
      SELECT b.id, b.booking_date, b.booking_time, b.status, b.phone, b.created_at, b.updated_at,
             u.telegram_id, u.first_name, u.username,
             e.id as exhibition_id, e.name as exhibition_name, e.price
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN exhibitions e ON b.exhibition_id = e.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (date_from) {
      query += ` AND b.booking_date >= $${paramIndex++}`;
      params.push(date_from as string);
    }

    if (date_to) {
      query += ` AND b.booking_date <= $${paramIndex++}`;
      params.push(date_to as string);
    }

    if (exhibition_id) {
      query += ` AND b.exhibition_id = $${paramIndex++}`;
      params.push(parseInt(exhibition_id as string));
    }

    if (status) {
      query += ` AND b.status = $${paramIndex++}`;
      params.push(status as string);
    }

    query += ` ORDER BY b.booking_date ASC, b.booking_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get bookings failed:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

router.get('/bookings/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT b.*, u.telegram_id, u.first_name, u.username, u.phone as user_phone,
              e.name as exhibition_name, e.price
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN exhibitions e ON b.exhibition_id = e.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin get booking failed:', error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

router.patch('/bookings/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE bookings SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update status failed:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

router.patch('/bookings/:id/reschedule', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { booking_date, booking_time } = req.body;

  if (!booking_date || !booking_time) {
    res.status(400).json({ error: 'booking_date and booking_time are required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      'SELECT exhibition_id FROM bookings WHERE id = $1',
      [id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const exhibitionId = bookingResult.rows[0].exhibition_id;

    const exhibitionResult = await client.query(
      'SELECT capacity FROM exhibitions WHERE id = $1',
      [exhibitionId]
    );

    const capacity = exhibitionResult.rows[0].capacity;

    const countResult = await client.query(
      `SELECT COUNT(*) as booked FROM bookings
       WHERE exhibition_id = $1 AND booking_date = $2 AND booking_time = $3 
         AND status != 'cancelled' AND id != $4`,
      [exhibitionId, booking_date, booking_time, id]
    );

    const booked = parseInt(countResult.rows[0].booked);
    if (booked >= capacity) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'New time slot is fully booked' });
      return;
    }

    const result = await client.query(
      `UPDATE bookings SET booking_date = $1, booking_time = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, booking_date, booking_time, updated_at`,
      [booking_date, booking_time, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin reschedule failed:', error);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  } finally {
    client.release();
  }
});

router.delete('/bookings/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Admin delete booking failed:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE booking_date = $1) as today_bookings,
        COUNT(*) FILTER (WHERE booking_date = $1 AND status = 'confirmed') as today_confirmed,
        COUNT(*) FILTER (WHERE status = 'confirmed' AND booking_date >= $1) as upcoming_total,
        COUNT(*) FILTER (WHERE status = 'completed') as total_completed
      FROM bookings
    `, [today]);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Admin get stats failed:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
