import { Router, Response } from 'express';
import { query, queryOne, run } from '../database/db.js';
import { authMiddleware, requireVerified, AuthRequest } from '../middleware/auth.js';
import { calculateMatchScore, getMatchLevel } from '../utils/matching.js';
import type { Match, House, User } from '../../shared/types.js';

const router = Router();

function parseMatch(m: any): Match {
  return {
    id: m.id,
    houseId: m.house_id,
    seekerId: m.seeker_id,
    overallScore: m.overall_score,
    sleepScore: m.sleep_score,
    petScore: m.pet_score,
    smokingScore: m.smoking_score,
    genderScore: m.gender_score,
    habitScore: m.habit_score,
    locationScore: m.location_score,
    createdAt: m.created_at
  };
}

function parseHouse(h: any): House {
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

router.get('/', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Match[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const houses = await query('SELECT * FROM houses WHERE landlord_id != ?', [req.user.id]);
    
    for (const house of houses) {
      const h = parseHouse(house);
      const scores = calculateMatchScore(req.user, h);
      
      await run(
        `INSERT OR REPLACE INTO matches (house_id, seeker_id, overall_score, sleep_score, 
         pet_score, smoking_score, gender_score, habit_score, location_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [h.id, req.user.id, scores.overallScore, scores.sleepScore, scores.petScore,
         scores.smokingScore, scores.genderScore, scores.habitScore, scores.locationScore]
      );
    }
    
    const matches = await query(
      `SELECT m.*, h.*, u.nickname as landlord_nickname, u.avatar as landlord_avatar,
              u.real_name_verified as landlord_verified
       FROM matches m
       LEFT JOIN houses h ON m.house_id = h.id
       LEFT JOIN users u ON h.landlord_id = u.id
       WHERE m.seeker_id = ?
       ORDER BY m.overall_score DESC
       LIMIT 50`,
      [req.user.id]
    );
    
    const result: Match[] = matches.map(m => {
      const match = parseMatch(m);
      match.house = {
        ...parseHouse(m),
        landlord: {
          id: m.landlord_id,
          phone: '',
          nickname: m.landlord_nickname,
          avatar: m.landlord_avatar,
          realNameVerified: !!m.landlord_verified,
          hasPet: false,
          smoking: 'never' as const,
          createdAt: new Date()
        },
        matchScore: match.overallScore
      };
      match.seeker = req.user;
      return match;
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/house/:houseId', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Match[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const houseId = parseInt(req.params.houseId);
    
    const house = await queryOne('SELECT landlord_id FROM houses WHERE id = ?', [houseId]);
    if (!house) {
      res.status(404).json({ error: '房源不存在' });
      return;
    }
    
    if (house.landlord_id !== req.user.id) {
      res.status(403).json({ error: '无权限查看此房源的匹配' });
      return;
    }
    
    const seekers = await query('SELECT * FROM users WHERE id != ? AND real_name_verified = 1', [req.user.id]);
    const houseData = await queryOne('SELECT * FROM houses WHERE id = ?', [houseId]);
    const h = parseHouse(houseData!);
    
    for (const seeker of seekers) {
      const s = parseUser(seeker);
      const scores = calculateMatchScore(s, h);
      
      await run(
        `INSERT OR REPLACE INTO matches (house_id, seeker_id, overall_score, sleep_score, 
         pet_score, smoking_score, gender_score, habit_score, location_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [houseId, s.id, scores.overallScore, scores.sleepScore, scores.petScore,
         scores.smokingScore, scores.genderScore, scores.habitScore, scores.locationScore]
      );
    }
    
    const matches = await query(
      `SELECT m.*, u.*
       FROM matches m
       LEFT JOIN users u ON m.seeker_id = u.id
       WHERE m.house_id = ?
       ORDER BY m.overall_score DESC
       LIMIT 50`,
      [houseId]
    );
    
    const result: Match[] = matches.map(m => {
      const match = parseMatch(m);
      match.seeker = parseUser(m);
      return match;
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response<Match | { error: string }>) => {
  try {
    const matchId = parseInt(req.params.id);
    
    const matchData = await queryOne(
      `SELECT m.*, h.*, 
              seeker.nickname as seeker_nickname, seeker.avatar as seeker_avatar,
              seeker.real_name_verified as seeker_verified, seeker.sleep_time as seeker_sleep_time,
              seeker.wake_time as seeker_wake_time, seeker.has_pet as seeker_has_pet,
              seeker.pet_type as seeker_pet_type, seeker.smoking as seeker_smoking,
              seeker.cleaning_frequency as seeker_cleaning_frequency,
              seeker.social_preference as seeker_social_preference, seeker.gender as seeker_gender
       FROM matches m
       LEFT JOIN houses h ON m.house_id = h.id
       LEFT JOIN users seeker ON m.seeker_id = seeker.id
       WHERE m.id = ?`,
      [matchId]
    );
    
    if (!matchData) {
      res.status(404).json({ error: '匹配不存在' });
      return;
    }
    
    const match = parseMatch(matchData);
    match.house = parseHouse(matchData);
    match.seeker = {
      id: matchData.seeker_id,
      phone: '',
      nickname: matchData.seeker_nickname,
      avatar: matchData.seeker_avatar,
      realNameVerified: !!matchData.seeker_verified,
      sleepTime: matchData.seeker_sleep_time,
      wakeTime: matchData.seeker_wake_time,
      hasPet: !!matchData.seeker_has_pet,
      petType: matchData.seeker_pet_type,
      smoking: matchData.seeker_smoking,
      cleaningFrequency: matchData.seeker_cleaning_frequency,
      socialPreference: matchData.seeker_social_preference,
      gender: matchData.seeker_gender,
      createdAt: new Date()
    };
    
    res.json(match);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/calculate/:houseId', authMiddleware, requireVerified, async (req: AuthRequest, res: Response<Match | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const houseId = parseInt(req.params.houseId);
    const houseData = await queryOne(
      `SELECT h.*, u.nickname as landlord_nickname, u.avatar as landlord_avatar, 
              u.real_name_verified as landlord_verified
       FROM houses h LEFT JOIN users u ON h.landlord_id = u.id WHERE h.id = ?`,
      [houseId]
    );
    
    if (!houseData) {
      res.status(404).json({ error: '房源不存在' });
      return;
    }
    
    const house = parseHouse(houseData);
    const scores = calculateMatchScore(req.user, house);
    
    const existing = await queryOne<any>(
      'SELECT id FROM matches WHERE house_id = ? AND seeker_id = ?',
      [houseId, req.user.id]
    );
    
    if (existing) {
      await run(
        `UPDATE matches SET overall_score = ?, sleep_score = ?, pet_score = ?, 
         smoking_score = ?, gender_score = ?, habit_score = ?, location_score = ?,
         created_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [scores.overallScore, scores.sleepScore, scores.petScore,
         scores.smokingScore, scores.genderScore, scores.habitScore, scores.locationScore,
         existing.id]
      );
    } else {
      await run(
        `INSERT INTO matches (house_id, seeker_id, overall_score, sleep_score, 
         pet_score, smoking_score, gender_score, habit_score, location_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [houseId, req.user.id, scores.overallScore, scores.sleepScore, scores.petScore,
         scores.smokingScore, scores.genderScore, scores.habitScore, scores.locationScore]
      );
    }
    
    const finalMatch = await queryOne<any>(
      `SELECT m.* FROM matches m WHERE m.house_id = ? AND m.seeker_id = ?`,
      [houseId, req.user.id]
    );
    
    const match = parseMatch(finalMatch!);
    match.house = {
      ...house,
      landlord: {
        id: houseData.landlord_id,
        phone: '',
        nickname: houseData.landlord_nickname,
        avatar: houseData.landlord_avatar,
        realNameVerified: !!houseData.landlord_verified,
        hasPet: false,
        smoking: 'never' as const,
        createdAt: new Date()
      },
      matchScore: scores.overallScore
    };
    match.seeker = req.user;
    
    res.json(match);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
