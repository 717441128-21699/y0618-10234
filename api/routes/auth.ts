import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../database/db.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';
import type { User, LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest } from '../../shared/types.js';

const router = Router();

router.post('/login', async (req, res: Response<LoginResponse | { error: string }>) => {
  try {
    const { phone, password }: LoginRequest = req.body;
    
    const user = await queryOne<User>(
      'SELECT id, phone, nickname, avatar, password_hash as passwordHash, ' +
      'real_name_verified as realNameVerified, id_card as idCard, real_name as realName, ' +
      'sleep_time as sleepTime, wake_time as wakeTime, has_pet as hasPet, ' +
      'pet_type as petType, smoking, gender_preference as genderPreference, ' +
      'cleaning_frequency as cleaningFrequency, social_preference as socialPreference, ' +
      'gender, created_at as createdAt FROM users WHERE phone = ?',
      [phone]
    );
    
    if (!user) {
      res.status(401).json({ error: '手机号或密码错误' });
      return;
    }
    
    const userWithPass = user as User & { passwordHash: string };
    const isValid = await bcrypt.compare(password, userWithPass.passwordHash);
    
    if (!isValid) {
      res.status(401).json({ error: '手机号或密码错误' });
      return;
    }
    
    const { passwordHash, ...userWithoutPass } = userWithPass;
    const token = generateToken(user.id);
    
    res.json({ token, user: userWithoutPass as User });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/register', async (req, res: Response<{ message: string } | { error: string }>) => {
  try {
    const { phone, password, nickname }: RegisterRequest = req.body;
    
    if (!phone || !password || !nickname) {
      res.status(400).json({ error: '请填写完整信息' });
      return;
    }
    
    const existingUser = await queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      res.status(400).json({ error: '该手机号已注册' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`;
    
    await run(
      'INSERT INTO users (phone, password_hash, nickname, avatar) VALUES (?, ?, ?, ?)',
      [phone, hashedPassword, nickname, avatar]
    );
    
    res.json({ message: '注册成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/profile', authMiddleware, (req: AuthRequest, res: Response<User | { error: string }>) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: '未登录' });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response<User | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const updates: UpdateProfileRequest = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      nickname: 'nickname',
      avatar: 'avatar',
      sleepTime: 'sleep_time',
      wakeTime: 'wake_time',
      hasPet: 'has_pet',
      petType: 'pet_type',
      smoking: 'smoking',
      genderPreference: 'gender_preference',
      cleaningFrequency: 'cleaning_frequency',
      socialPreference: 'social_preference',
      gender: 'gender'
    };
    
    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }
    
    if (fields.length > 0) {
      values.push(req.user.id);
      await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    
    const updatedUser = await queryOne<User>(
      'SELECT id, phone, nickname, avatar, real_name_verified as realNameVerified, ' +
      'id_card as idCard, real_name as realName, sleep_time as sleepTime, ' +
      'wake_time as wakeTime, has_pet as hasPet, pet_type as petType, ' +
      'smoking, gender_preference as genderPreference, ' +
      'cleaning_frequency as cleaningFrequency, social_preference as socialPreference, ' +
      'gender, created_at as createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json(updatedUser!);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response<{ message: string; user: User } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const { idCard, realName } = req.body;
    
    if (!idCard || !realName) {
      res.status(400).json({ error: '请填写身份证号和真实姓名' });
      return;
    }
    
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      res.status(400).json({ error: '身份证号格式不正确' });
      return;
    }
    
    await run(
      'UPDATE users SET real_name_verified = 1, id_card = ?, real_name = ? WHERE id = ?',
      [idCard, realName, req.user.id]
    );
    
    const updatedUser = await queryOne<User>(
      'SELECT id, phone, nickname, avatar, real_name_verified as realNameVerified, ' +
      'id_card as idCard, real_name as realName, sleep_time as sleepTime, ' +
      'wake_time as wakeTime, has_pet as hasPet, pet_type as petType, ' +
      'smoking, gender_preference as genderPreference, ' +
      'cleaning_frequency as cleaningFrequency, social_preference as socialPreference, ' +
      'gender, created_at as createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json({ message: '实名认证成功', user: updatedUser! });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/users/:id', authMiddleware, async (req: AuthRequest, res: Response<User | { error: string }>) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await queryOne<User>(
      'SELECT id, phone, nickname, avatar, real_name_verified as realNameVerified, ' +
      'sleep_time as sleepTime, wake_time as wakeTime, has_pet as hasPet, ' +
      'pet_type as petType, smoking, gender_preference as genderPreference, ' +
      'cleaning_frequency as cleaningFrequency, social_preference as socialPreference, ' +
      'gender, created_at as createdAt FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
