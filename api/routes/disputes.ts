import { Router, Response } from 'express';
import { query, queryOne, run } from '../database/db.js';
import { authMiddleware, requireVerified, AuthRequest } from '../middleware/auth.js';
import type { Dispute, CreateDisputeRequest, MediationMessage, User } from '../../shared/types.js';

const router = Router();

function parseDispute(d: any): Dispute {
  return {
    id: d.id,
    houseId: d.house_id,
    applicantId: d.applicant_id,
    respondentId: d.respondent_id,
    type: d.type,
    description: d.description,
    evidences: d.evidences ? JSON.parse(d.evidences) : [],
    mediatorId: d.mediator_id,
    status: d.status,
    resolution: d.resolution,
    createdAt: d.created_at
  };
}

function parseMediationMessage(m: any): MediationMessage {
  return {
    id: m.id,
    disputeId: m.dispute_id,
    senderId: m.sender_id,
    senderRole: m.sender_role,
    content: m.content,
    createdAt: m.created_at
  };
}

function parseUser(u: any): User {
  return {
    id: u.id,
    phone: '',
    nickname: u.nickname,
    avatar: u.avatar,
    realNameVerified: !!u.real_name_verified,
    hasPet: false,
    smoking: 'never' as const,
    createdAt: u.created_at
  };
}

function parseHouse(h: any) {
  return {
    id: h.id,
    landlordId: h.landlord_id,
    title: h.title,
    location: h.location,
    district: h.district,
    rent: h.rent,
    area: h.area,
    roomType: h.room_type,
    orientation: h.orientation,
    floor: h.floor,
    photos: h.photos ? JSON.parse(h.photos) : [],
    facilities: h.facilities ? JSON.parse(h.facilities) : [],
    description: h.description,
    expectedSleepTime: h.expected_sleep_time,
    expectedWakeTime: h.expected_wake_time,
    allowPet: !!h.allow_pet,
    allowSmoking: !!h.allow_smoking,
    genderPreference: h.gender_preference,
    maxOccupants: h.max_occupants,
    currentOccupants: h.current_occupants,
    isRecruitment: !!h.is_recruitment,
    createdAt: h.created_at
  };
}

router.get('/', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Dispute[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const disputes = await query(
      `SELECT d.*, h.title as house_title, h.location as house_location,
              app.nickname as applicant_nickname, app.avatar as applicant_avatar,
              res.nickname as respondent_nickname, res.avatar as respondent_avatar
       FROM disputes d
       LEFT JOIN houses h ON d.house_id = h.id
       LEFT JOIN users app ON d.applicant_id = app.id
       LEFT JOIN users res ON d.respondent_id = res.id
       WHERE d.applicant_id = ? OR d.respondent_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.id, req.user.id]
    );
    
    const result: Dispute[] = disputes.map(d => {
      const dispute = parseDispute(d);
      dispute.house = {
        ...parseHouse(d),
        title: d.house_title,
        location: d.house_location
      };
      dispute.applicant = parseUser({
        id: d.applicant_id,
        nickname: d.applicant_nickname,
        avatar: d.applicant_avatar,
        created_at: new Date()
      });
      dispute.respondent = parseUser({
        id: d.respondent_id,
        nickname: d.respondent_nickname,
        avatar: d.respondent_avatar,
        created_at: new Date()
      });
      return dispute;
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Dispute | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const disputeId = parseInt(req.params.id);
    
    const disputeData = await queryOne(
      `SELECT d.*, h.*,
              app.nickname as applicant_nickname, app.avatar as applicant_avatar, app.real_name_verified as applicant_verified,
              res.nickname as respondent_nickname, res.avatar as respondent_avatar, res.real_name_verified as respondent_verified
       FROM disputes d
       LEFT JOIN houses h ON d.house_id = h.id
       LEFT JOIN users app ON d.applicant_id = app.id
       LEFT JOIN users res ON d.respondent_id = res.id
       WHERE d.id = ?`,
      [disputeId]
    );
    
    if (!disputeData) {
      res.status(404).json({ error: '纠纷不存在' });
      return;
    }
    
    if (disputeData.applicant_id !== req.user.id && disputeData.respondent_id !== req.user.id) {
      res.status(403).json({ error: '无权限查看此纠纷' });
      return;
    }
    
    const dispute = parseDispute(disputeData);
    dispute.house = parseHouse(disputeData);
    dispute.applicant = parseUser({
      id: disputeData.applicant_id,
      nickname: disputeData.applicant_nickname,
      avatar: disputeData.applicant_avatar,
      real_name_verified: disputeData.applicant_verified,
      created_at: new Date()
    });
    dispute.respondent = parseUser({
      id: disputeData.respondent_id,
      nickname: disputeData.respondent_nickname,
      avatar: disputeData.respondent_avatar,
      real_name_verified: disputeData.respondent_verified,
      created_at: new Date()
    });
    
    res.json(dispute);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/messages', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<MediationMessage[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const disputeId = parseInt(req.params.id);
    
    const dispute = await queryOne(
      'SELECT applicant_id, respondent_id FROM disputes WHERE id = ?',
      [disputeId]
    );
    
    if (!dispute) {
      res.status(404).json({ error: '纠纷不存在' });
      return;
    }
    
    if (dispute.applicant_id !== req.user.id && dispute.respondent_id !== req.user.id) {
      res.status(403).json({ error: '无权限查看此纠纷的消息' });
      return;
    }
    
    const messages = await query(
      `SELECT mm.*, u.nickname as sender_nickname, u.avatar as sender_avatar
       FROM mediation_messages mm
       LEFT JOIN users u ON mm.sender_id = u.id
       WHERE mm.dispute_id = ?
       ORDER BY mm.created_at ASC`,
      [disputeId]
    );
    
    const result: MediationMessage[] = messages.map(m => {
      const message = parseMediationMessage(m);
      message.sender = parseUser({
        id: m.sender_id,
        nickname: m.sender_nickname,
        avatar: m.sender_avatar,
        created_at: new Date()
      });
      return message;
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ id: number; message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const data: CreateDisputeRequest = req.body;
    
    if (!data.houseId || !data.respondentId || !data.type || !data.description) {
      res.status(400).json({ error: '请填写完整信息' });
      return;
    }
    
    if (data.respondentId === req.user.id) {
      res.status(400).json({ error: '不能对自己发起纠纷' });
      return;
    }
    
    const house = await queryOne('SELECT id FROM houses WHERE id = ?', [data.houseId]);
    if (!house) {
      res.status(404).json({ error: '房源不存在' });
      return;
    }
    
    const respondent = await queryOne('SELECT id FROM users WHERE id = ?', [data.respondentId]);
    if (!respondent) {
      res.status(404).json({ error: '被申请人不存在' });
      return;
    }
    
    const evidences = JSON.stringify(data.evidences || []);
    
    const result = await run(
      `INSERT INTO disputes (house_id, applicant_id, respondent_id, type, description, evidences, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [data.houseId, req.user.id, data.respondentId, data.type, data.description, evidences]
    );
    
    res.json({ id: result.lastID, message: '纠纷申请已提交，等待平台分配调解员' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/message', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const disputeId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      res.status(400).json({ error: '请填写消息内容' });
      return;
    }
    
    const dispute = await queryOne(
      'SELECT applicant_id, respondent_id, status FROM disputes WHERE id = ?',
      [disputeId]
    );
    
    if (!dispute) {
      res.status(404).json({ error: '纠纷不存在' });
      return;
    }
    
    if (dispute.status === 'closed' || dispute.status === 'resolved') {
      res.status(400).json({ error: '此纠纷已关闭，无法继续沟通' });
      return;
    }
    
    let senderRole: 'applicant' | 'respondent' | 'mediator' | null = null;
    
    if (dispute.applicant_id === req.user.id) {
      senderRole = 'applicant';
    } else if (dispute.respondent_id === req.user.id) {
      senderRole = 'respondent';
    }
    
    if (!senderRole) {
      res.status(403).json({ error: '无权限在此纠纷中发送消息' });
      return;
    }
    
    await run(
      `INSERT INTO mediation_messages (dispute_id, sender_id, sender_role, content)
       VALUES (?, ?, ?, ?)`,
      [disputeId, req.user.id, senderRole, content]
    );
    
    if (dispute.status === 'pending') {
      await run(
        `UPDATE disputes SET status = 'mediating' WHERE id = ?`,
        [disputeId]
      );
    }
    
    res.json({ message: '消息发送成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/resolve', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const disputeId = parseInt(req.params.id);
    const { resolution } = req.body;
    
    const dispute = await queryOne(
      'SELECT applicant_id, respondent_id, status FROM disputes WHERE id = ?',
      [disputeId]
    );
    
    if (!dispute) {
      res.status(404).json({ error: '纠纷不存在' });
      return;
    }
    
    if (dispute.applicant_id !== req.user.id && dispute.respondent_id !== req.user.id) {
      res.status(403).json({ error: '无权限处理此纠纷' });
      return;
    }
    
    if (!resolution) {
      res.status(400).json({ error: '请提供解决方案' });
      return;
    }
    
    await run(
      `UPDATE disputes SET status = 'resolved', resolution = ? WHERE id = ?`,
      [resolution, disputeId]
    );
    
    res.json({ message: '纠纷已解决' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/close', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const disputeId = parseInt(req.params.id);
    
    const dispute = await queryOne(
      'SELECT applicant_id FROM disputes WHERE id = ?',
      [disputeId]
    );
    
    if (!dispute) {
      res.status(404).json({ error: '纠纷不存在' });
      return;
    }
    
    if (dispute.applicant_id !== req.user.id) {
      res.status(403).json({ error: '只有申请人可以关闭纠纷' });
      return;
    }
    
    await run(
      `UPDATE disputes SET status = 'closed' WHERE id = ?`,
      [disputeId]
    );
    
    res.json({ message: '纠纷已关闭' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
