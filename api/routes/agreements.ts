import { Router, Response } from 'express';
import { query, queryOne, run } from '../database/db.js';
import { authMiddleware, requireVerified, AuthRequest } from '../middleware/auth.js';
import type { Agreement, CreateAgreementRequest, SignAgreementRequest, User } from '../../shared/types.js';

const router = Router();

function parseAgreement(a: any): Agreement {
  return {
    id: a.id,
    houseId: a.house_id,
    partyAId: a.party_a_id,
    partyBId: a.party_b_id,
    content: a.content,
    publicAreaRules: a.public_area_rules,
    costSharing: a.cost_sharing,
    penaltyTerms: a.penalty_terms,
    startDate: a.start_date,
    endDate: a.end_date,
    signatureA: a.signature_a,
    signatureB: a.signature_b,
    signedAt: a.signed_at,
    status: a.status,
    createdAt: a.created_at
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

router.get('/', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Agreement[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const agreements = await query(
      `SELECT a.*, h.title as house_title, h.location as house_location, h.district as house_district, h.rent as house_rent,
              pa.nickname as party_a_nickname, pa.avatar as party_a_avatar, pa.real_name_verified as party_a_verified,
              pb.nickname as party_b_nickname, pb.avatar as party_b_avatar, pb.real_name_verified as party_b_verified
       FROM agreements a
       LEFT JOIN houses h ON a.house_id = h.id
       LEFT JOIN users pa ON a.party_a_id = pa.id
       LEFT JOIN users pb ON a.party_b_id = pb.id
       WHERE a.party_a_id = ? OR a.party_b_id = ?
       ORDER BY a.created_at DESC`,
      [req.user.id, req.user.id]
    );
    
    const result: Agreement[] = agreements.map(a => {
      const agreement = parseAgreement(a);
      agreement.house = {
        ...parseHouse(a),
        title: a.house_title,
        location: a.house_location,
        district: a.house_district,
        rent: a.house_rent
      };
      agreement.partyA = {
        id: a.party_a_id,
        phone: '',
        nickname: a.party_a_nickname,
        avatar: a.party_a_avatar,
        realNameVerified: !!a.party_a_verified,
        hasPet: false,
        smoking: 'never',
        createdAt: new Date()
      };
      agreement.partyB = {
        id: a.party_b_id,
        phone: '',
        nickname: a.party_b_nickname,
        avatar: a.party_b_avatar,
        realNameVerified: !!a.party_b_verified,
        hasPet: false,
        smoking: 'never',
        createdAt: new Date()
      };
      return agreement;
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Agreement | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const agreementId = parseInt(req.params.id);
    
    const agreementData = await queryOne(
      `SELECT a.*, h.*,
              pa.nickname as party_a_nickname, pa.avatar as party_a_avatar, pa.real_name_verified as party_a_verified,
              pb.nickname as party_b_nickname, pb.avatar as party_b_avatar, pb.real_name_verified as party_b_verified
       FROM agreements a
       LEFT JOIN houses h ON a.house_id = h.id
       LEFT JOIN users pa ON a.party_a_id = pa.id
       LEFT JOIN users pb ON a.party_b_id = pb.id
       WHERE a.id = ?`,
      [agreementId]
    );
    
    if (!agreementData) {
      res.status(404).json({ error: '协议不存在' });
      return;
    }
    
    if (agreementData.party_a_id !== req.user.id && agreementData.party_b_id !== req.user.id) {
      res.status(403).json({ error: '无权限查看此协议' });
      return;
    }
    
    const agreement = parseAgreement(agreementData);
    agreement.house = parseHouse(agreementData);
    agreement.partyA = {
      id: agreementData.party_a_id,
      phone: '',
      nickname: agreementData.party_a_nickname,
      avatar: agreementData.party_a_avatar,
      realNameVerified: !!agreementData.party_a_verified,
      hasPet: false,
      smoking: 'never',
      createdAt: new Date()
    };
    agreement.partyB = {
      id: agreementData.party_b_id,
      phone: '',
      nickname: agreementData.party_b_nickname,
      avatar: agreementData.party_b_avatar,
      realNameVerified: !!agreementData.party_b_verified,
      hasPet: false,
      smoking: 'never',
      createdAt: new Date()
    };
    
    res.json(agreement);
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
    
    const data: CreateAgreementRequest = req.body;
    
    const house = await queryOne('SELECT landlord_id, current_occupants, max_occupants FROM houses WHERE id = ?', [data.houseId]);
    if (!house) {
      res.status(404).json({ error: '房源不存在' });
      return;
    }
    
    if (house.landlord_id !== req.user.id) {
      res.status(403).json({ error: '只有房东才能创建协议' });
      return;
    }
    
    if (data.partyBId === req.user.id) {
      res.status(400).json({ error: '不能与自己签订协议' });
      return;
    }
    
    const partyB = await queryOne('SELECT id, real_name_verified FROM users WHERE id = ?', [data.partyBId]);
    if (!partyB) {
      res.status(404).json({ error: '乙方用户不存在' });
      return;
    }
    
    if (!partyB.real_name_verified) {
      res.status(400).json({ error: '乙方需要完成实名认证才能签订协议' });
      return;
    }
    
    const result = await run(
      `INSERT INTO agreements (house_id, party_a_id, party_b_id, content, public_area_rules, 
       cost_sharing, penalty_terms, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.houseId, req.user.id, data.partyBId, data.content,
        data.publicAreaRules, data.costSharing, data.penaltyTerms,
        data.startDate, data.endDate
      ]
    );
    
    res.json({ id: result.lastID, message: '协议创建成功，等待对方签署' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/sign', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ message: string; agreement: Agreement } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const agreementId = parseInt(req.params.id);
    const { signature }: SignAgreementRequest = req.body;
    
    if (!signature) {
      res.status(400).json({ error: '请提供签名' });
      return;
    }
    
    const agreement = await queryOne(
      'SELECT * FROM agreements WHERE id = ?',
      [agreementId]
    );
    
    if (!agreement) {
      res.status(404).json({ error: '协议不存在' });
      return;
    }
    
    let updateField: string | null = null;
    
    if (agreement.party_a_id === req.user.id) {
      updateField = 'signature_a';
    } else if (agreement.party_b_id === req.user.id) {
      updateField = 'signature_b';
    } else {
      res.status(403).json({ error: '无权限签署此协议' });
      return;
    }
    
    await run(
      `UPDATE agreements SET ${updateField} = ? WHERE id = ?`,
      [signature, agreementId]
    );
    
    const updatedAgreement = await queryOne('SELECT * FROM agreements WHERE id = ?', [agreementId]);
    
    if (updatedAgreement!.signature_a && updatedAgreement!.signature_b) {
      await run(
        `UPDATE agreements SET status = 'signed', signed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [agreementId]
      );
      
      await run(
        `UPDATE houses SET current_occupants = current_occupants + 1 WHERE id = ?`,
        [updatedAgreement!.house_id]
      );
    }
    
    const finalAgreement = await queryOne(
      `SELECT a.*, h.*,
              pa.nickname as party_a_nickname, pa.avatar as party_a_avatar, pa.real_name_verified as party_a_verified,
              pb.nickname as party_b_nickname, pb.avatar as party_b_avatar, pb.real_name_verified as party_b_verified
       FROM agreements a
       LEFT JOIN houses h ON a.house_id = h.id
       LEFT JOIN users pa ON a.party_a_id = pa.id
       LEFT JOIN users pb ON a.party_b_id = pb.id
       WHERE a.id = ?`,
      [agreementId]
    );
    
    const result = parseAgreement(finalAgreement!);
    result.house = parseHouse(finalAgreement!);
    result.partyA = parseUser({ id: finalAgreement!.party_a_id, nickname: finalAgreement!.party_a_nickname, avatar: finalAgreement!.party_a_avatar, real_name_verified: finalAgreement!.party_a_verified, created_at: new Date() });
    result.partyB = parseUser({ id: finalAgreement!.party_b_id, nickname: finalAgreement!.party_b_nickname, avatar: finalAgreement!.party_b_avatar, real_name_verified: finalAgreement!.party_b_verified, created_at: new Date() });
    
    const message = result.status === 'signed' ? '协议签署完成！' : '签名成功，等待对方签署';
    res.json({ message, agreement: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/terminate', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const agreementId = parseInt(req.params.id);
    
    const agreement = await queryOne(
      'SELECT * FROM agreements WHERE id = ?',
      [agreementId]
    );
    
    if (!agreement) {
      res.status(404).json({ error: '协议不存在' });
      return;
    }
    
    if (agreement.party_a_id !== req.user.id && agreement.party_b_id !== req.user.id) {
      res.status(403).json({ error: '无权限终止此协议' });
      return;
    }
    
    await run(
      `UPDATE agreements SET status = 'terminated' WHERE id = ?`,
      [agreementId]
    );
    
    res.json({ message: '协议已终止' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
