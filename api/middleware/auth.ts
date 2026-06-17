import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../database/db.js';
import type { User } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'roommate_match_secret_key_2024';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }
  
  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    queryOne<User>(
      'SELECT id, phone, nickname, avatar, real_name_verified as realNameVerified, ' +
      'id_card as idCard, real_name as realName, sleep_time as sleepTime, ' +
      'wake_time as wakeTime, has_pet as hasPet, pet_type as petType, ' +
      'smoking, gender_preference as genderPreference, ' +
      'cleaning_frequency as cleaningFrequency, social_preference as socialPreference, ' +
      'gender, created_at as createdAt FROM users WHERE id = ?',
      [decoded.userId]
    ).then(user => {
      if (!user) {
        res.status(401).json({ error: '用户不存在' });
        return;
      }
      req.user = user;
      next();
    }).catch(() => {
      res.status(500).json({ error: '服务器错误' });
    });
  } catch (err) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
}

export function requireVerified(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  
  if (!req.user.realNameVerified) {
    res.status(403).json({ error: '需要完成实名认证才能使用此功能' });
    return;
  }
  
  next();
}
