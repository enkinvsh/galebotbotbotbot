import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { validateInitData } from '../middleware/auth.js';
import { sendBookingConfirmation } from '../bot/index.js';

const router = Router();

const TIME_SLOTS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

router.get('/availability', async (req: Request, res: Response): Promise<void> => {
  const { exhibition_id, date } = req.query;

  if (!exhibition_id || !date) {
    res.status(400).json({ error: 'exhibition_id and date are required' });
    return;
  }

  try {
    const exhibitionResult = await pool.query(
      'SELECT capacity, schedule_days FROM exhibitions WHERE id = $1',
      [exhibition_id]
    );

    if (exhibitionResult.rows.length === 0) {
      res.status(404).json({ error: 'Exhibition not found' });
      return;
    }

    const { capacity, schedule_days } = exhibitionResult.rows[0];
    const dateObj = new Date(date as string);
    const dayOfWeek = dateObj.getDay();

    if (!schedule_days.includes(dayOfWeek)) {
      res.json({ slots: [], message: 'Выставка не работает в этот день' });
      return;
    }

    const bookingsResult = await pool.query(
      `SELECT booking_time, COUNT(*) as booked
       FROM bookings
       WHERE exhibition_id = $1 AND booking_date = $2 AND status != 'cancelled'
       GROUP BY booking_time`,
      [exhibition_id, date]
    );

    const bookedMap = new Map<string, number>();
    bookingsResult.rows.forEach(row => {
      bookedMap.set(row.booking_time.slice(0, 5), parseInt(row.booked));
    });

    const slots = TIME_SLOTS.map(time => {
      const booked = bookedMap.get(time) || 0;
      return {
        time,
        booked,
        capacity,
        available: capacity - booked,
        is_available: booked < capacity
      };
    });

    res.json({ slots, exhibition_id, date });
  } catch (error) {
    console.error('Get availability failed:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

router.post('/', validateInitData, async (req: Request, res: Response): Promise<void> => {
  const user = req.telegramUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { exhibition_id, booking_date, booking_time, phone } = req.body;

  if (!exhibition_id || !booking_date || !booking_time || !phone) {
    res.status(400).json({ error: 'exhibition_id, booking_date, booking_time, and phone are required' });
    return;
  }

  const phoneRegex = /^\+7\d{10}$/;
  if (!phoneRegex.test(phone)) {
    res.status(400).json({ error: 'Phone must be in format +79XXXXXXXXX' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let userResult = await client.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      userResult = await client.query(
        `INSERT INTO users (telegram_id, first_name, username, phone)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [user.id, user.first_name, user.username || null, phone]
      );
    } else {
      await client.query(
        'UPDATE users SET phone = $1 WHERE telegram_id = $2',
        [phone, user.id]
      );
    }

    const userId = userResult.rows[0].id;

    const exhibitionResult = await client.query(
      'SELECT id, name, capacity, schedule_days FROM exhibitions WHERE id = $1 AND is_active = true',
      [exhibition_id]
    );

    if (exhibitionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Exhibition not found' });
      return;
    }

    const exhibition = exhibitionResult.rows[0];
    const dateObj = new Date(booking_date);
    const dayOfWeek = dateObj.getDay();

    if (!exhibition.schedule_days.includes(dayOfWeek)) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Выставка не работает в выбранный день' });
      return;
    }

    const countResult = await client.query(
      `SELECT COUNT(*) as booked FROM bookings
       WHERE exhibition_id = $1 AND booking_date = $2 AND booking_time = $3 AND status != 'cancelled'`,
      [exhibition_id, booking_date, booking_time]
    );

    const booked = parseInt(countResult.rows[0].booked);
    if (booked >= exhibition.capacity) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Это время уже занято. Пожалуйста, выберите другое время.' });
      return;
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, exhibition_id, booking_date, booking_time, phone, status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')
       RETURNING id, booking_date, booking_time, status, created_at`,
      [userId, exhibition_id, booking_date, booking_time, phone]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];
    
    sendBookingConfirmation(user.id, {
      exhibition_name: exhibition.name,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time
    }).catch(err => console.error('Failed to send confirmation:', err));

    res.status(201).json({
      id: booking.id,
      exhibition_id,
      exhibition_name: exhibition.name,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      phone,
      status: booking.status,
      created_at: booking.created_at
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create booking failed:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    client.release();
  }
});

router.get('/my', validateInitData, async (req: Request, res: Response): Promise<void> => {
  const user = req.telegramUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT b.id, b.booking_date, b.booking_time, b.status, b.phone, b.created_at,
              e.id as exhibition_id, e.name as exhibition_name, e.price
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN exhibitions e ON b.exhibition_id = e.id
       WHERE u.telegram_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user bookings failed:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

router.patch('/:id/cancel', validateInitData, async (req: Request, res: Response): Promise<void> => {
  const user = req.telegramUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = (SELECT id FROM users WHERE telegram_id = $2)
         AND status NOT IN ('cancelled', 'completed')
       RETURNING id, status`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Booking not found or cannot be cancelled' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cancel booking failed:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;
