import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

const DAY_NAMES: Record<number, string> = {
  0: 'воскресенье',
  1: 'понедельник',
  2: 'вторник',
  3: 'среда',
  4: 'четверг',
  5: 'пятница',
  6: 'суббота'
};

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, duration_minutes, price, capacity, schedule_days, is_active
       FROM exhibitions
       WHERE is_active = true
       ORDER BY id`
    );

    const exhibitions = result.rows.map(row => ({
      ...row,
      schedule_text: row.schedule_days.length === 7 
        ? 'ежедневно' 
        : row.schedule_days.map((d: number) => DAY_NAMES[d]).join(', ')
    }));

    res.json(exhibitions);
  } catch (error) {
    console.error('Get exhibitions failed:', error);
    res.status(500).json({ error: 'Failed to get exhibitions' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, name, description, duration_minutes, price, capacity, schedule_days, is_active
       FROM exhibitions
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Exhibition not found' });
      return;
    }

    const exhibition = result.rows[0];
    exhibition.schedule_text = exhibition.schedule_days.length === 7 
      ? 'ежедневно' 
      : exhibition.schedule_days.map((d: number) => DAY_NAMES[d]).join(', ');

    res.json(exhibition);
  } catch (error) {
    console.error('Get exhibition failed:', error);
    res.status(500).json({ error: 'Failed to get exhibition' });
  }
});

export default router;
