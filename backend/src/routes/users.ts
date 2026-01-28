import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { validateInitData } from '../middleware/auth.js';

const router = Router();

router.post('/', validateInitData, async (req: Request, res: Response): Promise<void> => {
  const user = req.telegramUser;
  if (!user) {
    res.status(401).json({ error: 'User not found in init data' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (telegram_id, first_name, last_name, username, language_code, is_premium)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (telegram_id) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         username = EXCLUDED.username,
         updated_at = NOW()
       RETURNING id, telegram_id, first_name, username, phone`,
      [user.id, user.first_name, user.last_name || null, user.username || null, 
       user.language_code || 'ru', user.is_premium || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('User upsert failed:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

router.get('/me', validateInitData, async (req: Request, res: Response): Promise<void> => {
  const user = req.telegramUser;
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, telegram_id, first_name, username, phone FROM users WHERE telegram_id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not registered' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user failed:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
