import { Request, Response, NextFunction } from 'express';
import pool from '../db.js';

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.telegramUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  try {
    const result = await pool.query(
      'SELECT admin_level FROM admins WHERE telegram_id = $1',
      [req.telegramUser.id]
    );
    
    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    req.isAdmin = true;
    req.adminLevel = result.rows[0].admin_level;
    next();
  } catch (error) {
    console.error('Admin check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
