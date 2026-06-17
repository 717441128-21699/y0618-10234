import { Router, Response } from 'express';
import { query, queryOne, run } from '../database/db.js';
import { authMiddleware, requireVerified, AuthRequest } from '../middleware/auth.js';
import type { Message, ChatSession, User } from '../../shared/types.js';

const router = Router();

function parseMessage(m: any): Message {
  return {
    id: m.id,
    chatId: m.chat_id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    content: m.content,
    type: m.type,
    isRead: !!m.is_read,
    createdAt: m.created_at
  };
}

function parseUser(u: any): User {
  return {
    id: u.id,
    phone: u.phone || '',
    nickname: u.nickname,
    avatar: u.avatar,
    realNameVerified: !!u.real_name_verified,
    sleepTime: u.sleep_time,
    wakeTime: u.wake_time,
    hasPet: !!u.has_pet,
    petType: u.pet_type,
    smoking: u.smoking,
    genderPreference: u.gender_preference,
    cleaningFrequency: u.cleaning_frequency,
    socialPreference: u.social_preference,
    gender: u.gender,
    createdAt: u.created_at
  };
}

router.get('/sessions', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<ChatSession[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const sessions = await query(
      `SELECT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
        MAX(id) as last_message_id
      FROM messages 
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_user_id
      ORDER BY last_message_id DESC`,
      [req.user.id, req.user.id, req.user.id]
    );
    
    const result: ChatSession[] = [];
    
    for (const session of sessions) {
      const otherUserId = session.other_user_id;
      
      const lastMessage = await queryOne(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
         ORDER BY id DESC LIMIT 1`,
        [req.user.id, otherUserId, otherUserId, req.user.id]
      );
      
      if (!lastMessage) continue;
      
      const otherUser = await queryOne(
        `SELECT id, nickname, avatar, real_name_verified, sleep_time, wake_time,
                has_pet, pet_type, smoking, gender_preference, cleaning_frequency,
                social_preference, gender, created_at
         FROM users WHERE id = ?`,
        [otherUserId]
      );
      
      if (!otherUser) continue;
      
      const unreadCount = await queryOne(
        `SELECT COUNT(*) as count FROM messages 
         WHERE receiver_id = ? AND sender_id = ? AND is_read = 0`,
        [req.user.id, otherUserId]
      );
      
      const matchScore = await queryOne(
        `SELECT m.overall_score FROM matches m
         LEFT JOIN houses h ON m.house_id = h.id
         WHERE (m.seeker_id = ? AND h.landlord_id = ?) 
            OR (m.seeker_id = ? AND h.landlord_id = ?)
         ORDER BY m.overall_score DESC LIMIT 1`,
        [req.user.id, otherUserId, otherUserId, req.user.id]
      );
      
      result.push({
        chatId: [Math.min(req.user.id, otherUserId), Math.max(req.user.id, otherUserId)].join('_'),
        otherUser: parseUser(otherUser),
        lastMessage: parseMessage(lastMessage),
        unreadCount: unreadCount?.count || 0,
        matchScore: matchScore?.overall_score
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:otherUserId', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Message[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const otherUserId = parseInt(req.params.otherUserId);
    
    await run(
      `UPDATE messages SET is_read = 1 
       WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
      [otherUserId, req.user.id]
    );
    
    const messages = await query(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY id DESC LIMIT 100`,
      [req.user.id, otherUserId, otherUserId, req.user.id]
    );
    
    const result = messages.map(m => parseMessage(m)).reverse();
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/send', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Message | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const { receiverId, content, type = 'text' } = req.body;
    
    if (!receiverId || !content) {
      res.status(400).json({ error: '请填写完整信息' });
      return;
    }
    
    if (receiverId === req.user.id) {
      res.status(400).json({ error: '不能给自己发消息' });
      return;
    }
    
    const receiver = await queryOne('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (!receiver) {
      res.status(404).json({ error: '接收用户不存在' });
      return;
    }
    
    const chatId = [Math.min(req.user.id, receiverId), Math.max(req.user.id, receiverId)].join('_');
    
    const result = await run(
      `INSERT INTO messages (chat_id, sender_id, receiver_id, content, type, is_read)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [chatId, req.user.id, receiverId, content, type]
    );
    
    const message = await queryOne('SELECT * FROM messages WHERE id = ?', [result.lastID]);
    
    res.json(parseMessage(message!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/read/:otherUserId', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const otherUserId = parseInt(req.params.otherUserId);
    
    await run(
      `UPDATE messages SET is_read = 1 
       WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
      [otherUserId, req.user.id]
    );
    
    res.json({ message: '已标记为已读' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/unread/count', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ count: number } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0`,
      [req.user.id]
    );
    
    res.json({ count: result?.count || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
