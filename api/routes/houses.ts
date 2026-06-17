import { Router, Response } from 'express';
import { query, queryOne, run } from '../database/db.js';
import { authMiddleware, requireVerified, AuthRequest } from '../middleware/auth.js';
import { calculateMatchScore } from '../utils/matching.js';
import type { House, CreateHouseRequest } from '../../shared/types.js';

const router = Router();

function parseHouse(house: any): House {
  return {
    ...house,
    photos: house.photos ? JSON.parse(house.photos) : [],
    facilities: house.facilities ? JSON.parse(house.facilities) : [],
    allowPet: !!house.allowPet,
    allowSmoking: !!house.allowSmoking,
    isRecruitment: !!house.isRecruitment,
    realNameVerified: !!house.realNameVerified,
    hasPet: !!house.hasPet
  };
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response<House[] | { error: string }>) => {
  try {
    const { 
      district, 
      minRent, 
      maxRent, 
      roomType, 
      allowPet, 
      allowSmoking, 
      isRecruitment,
      page = '1',
      limit = '20'
    } = req.query;
    
    let sql = `
      SELECT h.*, u.nickname as landlord_nickname, u.avatar as landlord_avatar,
             u.real_name_verified as landlord_verified
      FROM houses h
      LEFT JOIN users u ON h.landlord_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (district) {
      sql += ' AND h.district = ?';
      params.push(district);
    }
    if (minRent) {
      sql += ' AND h.rent >= ?';
      params.push(parseInt(minRent as string));
    }
    if (maxRent) {
      sql += ' AND h.rent <= ?';
      params.push(parseInt(maxRent as string));
    }
    if (roomType) {
      sql += ' AND h.room_type = ?';
      params.push(roomType);
    }
    if (allowPet !== undefined) {
      sql += ' AND h.allow_pet = ?';
      params.push(allowPet === 'true' ? 1 : 0);
    }
    if (allowSmoking !== undefined) {
      sql += ' AND h.allow_smoking = ?';
      params.push(allowSmoking === 'true' ? 1 : 0);
    }
    if (isRecruitment !== undefined) {
      sql += ' AND h.is_recruitment = ?';
      params.push(isRecruitment === 'true' ? 1 : 0);
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    sql += ` ORDER BY h.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);
    
    const houses = await query(sql, params);
    
    const result: House[] = houses.map(h => {
      const house = parseHouse({
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
        photos: h.photos,
        facilities: h.facilities,
        description: h.description,
        expectedSleepTime: h.expected_sleep_time,
        expectedWakeTime: h.expected_wake_time,
        allowPet: h.allow_pet,
        allowSmoking: h.allow_smoking,
        genderPreference: h.gender_preference,
        maxOccupants: h.max_occupants,
        currentOccupants: h.current_occupants,
        isRecruitment: h.is_recruitment,
        createdAt: h.created_at
      });
      
      house.landlord = {
        id: h.landlord_id,
        phone: '',
        nickname: h.landlord_nickname,
        avatar: h.landlord_avatar,
        realNameVerified: !!h.landlord_verified,
        hasPet: false,
        smoking: 'never',
        createdAt: new Date()
      };
      
      return house;
    });
    
    if (req.user) {
      for (const house of result) {
        const scores = calculateMatchScore(req.user, house);
        house.matchScore = scores.overallScore;
      }
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response<House[] | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const houses = await query(
      'SELECT * FROM houses WHERE landlord_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    const result = houses.map(h => parseHouse({
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
      photos: h.photos,
      facilities: h.facilities,
      description: h.description,
      expectedSleepTime: h.expected_sleep_time,
      expectedWakeTime: h.expected_wake_time,
      allowPet: h.allow_pet,
      allowSmoking: h.allow_smoking,
      genderPreference: h.gender_preference,
      maxOccupants: h.max_occupants,
      currentOccupants: h.current_occupants,
      isRecruitment: h.is_recruitment,
      createdAt: h.created_at
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response<House | { error: string }>) => {
  try {
    const houseId = parseInt(req.params.id);
    
    const houseData = await queryOne(
      `SELECT h.*, u.nickname as landlord_nickname, u.avatar as landlord_avatar,
              u.real_name_verified as landlord_verified, u.sleep_time as landlord_sleep_time,
              u.wake_time as landlord_wake_time, u.has_pet as landlord_has_pet,
              u.pet_type as landlord_pet_type, u.smoking as landlord_smoking,
              u.cleaning_frequency as landlord_cleaning_frequency,
              u.social_preference as landlord_social_preference, u.gender as landlord_gender
       FROM houses h
       LEFT JOIN users u ON h.landlord_id = u.id
       WHERE h.id = ?`,
      [houseId]
    );
    
    if (!houseData) {
      res.status(404).json({ error: '房源不存在' });
      return;
    }
    
    const house = parseHouse({
      id: houseData.id,
      landlordId: houseData.landlord_id,
      title: houseData.title,
      location: houseData.location,
      district: houseData.district,
      rent: houseData.rent,
      area: houseData.area,
      roomType: houseData.room_type,
      orientation: houseData.orientation,
      floor: houseData.floor,
      photos: houseData.photos,
      facilities: houseData.facilities,
      description: houseData.description,
      expectedSleepTime: houseData.expected_sleep_time,
      expectedWakeTime: houseData.expected_wake_time,
      allowPet: houseData.allow_pet,
      allowSmoking: houseData.allow_smoking,
      genderPreference: houseData.gender_preference,
      maxOccupants: houseData.max_occupants,
      currentOccupants: houseData.current_occupants,
      isRecruitment: houseData.is_recruitment,
      createdAt: houseData.created_at
    });
    
    house.landlord = {
      id: houseData.landlord_id,
      phone: '',
      nickname: houseData.landlord_nickname,
      avatar: houseData.landlord_avatar,
      realNameVerified: !!houseData.landlord_verified,
      sleepTime: houseData.landlord_sleep_time,
      wakeTime: houseData.landlord_wake_time,
      hasPet: !!houseData.landlord_has_pet,
      petType: houseData.landlord_pet_type,
      smoking: houseData.landlord_smoking,
      cleaningFrequency: houseData.landlord_cleaning_frequency,
      socialPreference: houseData.landlord_social_preference,
      gender: houseData.landlord_gender,
      createdAt: new Date()
    };
    
    if (req.user) {
      const scores = calculateMatchScore(req.user, house);
      house.matchScore = scores.overallScore;
    }
    
    res.json(house);
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
    
    const data: CreateHouseRequest = req.body;
    const photos = JSON.stringify(data.photos || []);
    const facilities = JSON.stringify(data.facilities || []);
    
    const result = await run(
      `INSERT INTO houses (landlord_id, title, location, district, rent, area, room_type, 
       orientation, floor, photos, facilities, description, expected_sleep_time, 
       expected_wake_time, allow_pet, allow_smoking, gender_preference, max_occupants, 
       current_occupants, is_recruitment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, data.title, data.location, data.district, data.rent, data.area,
        data.roomType, data.orientation, data.floor, photos, facilities, data.description,
        data.expectedSleepTime, data.expectedWakeTime,
        data.allowPet ? 1 : 0, data.allowSmoking ? 1 : 0, data.genderPreference,
        data.maxOccupants, data.currentOccupants, data.isRecruitment ? 1 : 0
      ]
    );
    
    res.json({ id: result.lastID, message: '发布成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const houseId = parseInt(req.params.id);
    const house = await queryOne('SELECT landlord_id FROM houses WHERE id = ?', [houseId]);
    
    if (!house) {
      res.status(404).json({ error: '房源不存在' });
      return;
    }
    
    if (house.landlord_id !== req.user.id) {
      res.status(403).json({ error: '无权限修改此房源' });
      return;
    }
    
    const data: Partial<CreateHouseRequest> = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      title: 'title', location: 'location', district: 'district',
      rent: 'rent', area: 'area', roomType: 'room_type',
      orientation: 'orientation', floor: 'floor', description: 'description',
      expectedSleepTime: 'expected_sleep_time', expectedWakeTime: 'expected_wake_time',
      allowPet: 'allow_pet', allowSmoking: 'allow_smoking',
      genderPreference: 'gender_preference', maxOccupants: 'max_occupants',
      currentOccupants: 'current_occupants', isRecruitment: 'is_recruitment'
    };
    
    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        if (key === 'photos' || key === 'facilities') {
          fields.push(`${dbField} = ?`);
          values.push(JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          fields.push(`${dbField} = ?`);
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${dbField} = ?`);
          values.push(value);
        }
      }
    }
    
    if (fields.length > 0) {
      values.push(houseId);
      await run(`UPDATE houses SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response<{ message: string } | { error: string }>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    
    const houseId = parseInt(req.params.id);
    const house = await queryOne('SELECT landlord_id FROM houses WHERE id = ?', [houseId]);
    
    if (!house) {
      res.status(404).json({ error: '房源不存在' });
      return;
    }
    
    if (house.landlord_id !== req.user.id) {
      res.status(403).json({ error: '无权限删除此房源' });
      return;
    }
    
    await run('DELETE FROM houses WHERE id = ?', [houseId]);
    
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
