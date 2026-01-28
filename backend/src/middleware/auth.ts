import { Request, Response, NextFunction } from 'express';
import { validate } from '@tma.js/init-data-node';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
      isAdmin?: boolean;
      adminLevel?: number;
    }
  }
}

export function validateInitData(req: Request, res: Response, next: NextFunction): void {
  const initData = req.headers['x-telegram-init-data'] as string;
  
  if (!initData) {
    res.status(401).json({ error: 'Missing X-Telegram-Init-Data header' });
    return;
  }
  
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      res.status(500).json({ error: 'Bot token not configured' });
      return;
    }
    
    if (process.env.NODE_ENV !== 'development') {
      validate(initData, botToken, { expiresIn: 86400 });
    }
    
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    
    if (userJson) {
      req.telegramUser = JSON.parse(userJson);
    }
    
    next();
  } catch (error) {
    console.error('InitData validation failed:', error);
    res.status(403).json({ error: 'Invalid Telegram init data' });
  }
}
