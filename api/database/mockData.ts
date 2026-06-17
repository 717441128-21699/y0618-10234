import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

const dbPath = './data/roommate.db';
const db = new sqlite3.Database(dbPath);

const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区'];
const roomTypes = ['主卧', '次卧', '单间', '合租公寓'];
const orientations = ['朝南', '朝北', '朝东', '朝西'];
const smokingOptions = ['never', 'occasionally', 'often'];
const genders = ['male', 'female'];
const sleepTimes = ['22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00'];
const wakeTimes = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];
const petTypes = ['猫', '狗', '仓鼠', '鹦鹉', '鱼', '无'];
const cleaningFrequencies = ['每天', '每两天', '每周', '每两周', '每月'];
const socialPreferences = ['喜欢社交', '偶尔社交', '喜欢独处', '看情况'];

const houseTitles = [
  '阳光主卧带阳台', '温馨次卧近地铁', '精装单间独立卫浴',
  '朝南主卧采光好', '合租公寓次卧', '主卧带独立卫生间',
  '次卧紧邻商圈', '单间配套齐全', '主卧落地窗',
  '次卧带飘窗', '单间交通便利', '合租主卧带阳台'
];

const locations = [
  '望京SOHO附近', '中关村软件园', '国贸CBD周边',
  '西二旗地铁站旁', '五道口地铁站', '三里屯太古里',
  '东直门交通枢纽', '朝阳公园附近', '颐和园周边',
  '北京南站附近', '首都机场生活区', '亦庄经济开发区'
];

const facilities = [
  '空调', '洗衣机', '冰箱', '微波炉', '热水器', '燃气灶',
  '油烟机', '沙发', '茶几', '餐桌', '衣柜', '书桌',
  '椅子', '床', '床垫', '枕头', '被子', 'wifi',
  '暖气', '电梯', '停车位', '阳台', '飘窗', '储物间'
];

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  const prefixes = ['138', '139', '188', '189', '158', '159', '136', '137'];
  const prefix = randomChoice(prefixes);
  const suffix = randomInt(10000000, 99999999).toString();
  return prefix + suffix;
}

function generateName(): string {
  return randomChoice(firstNames) + randomChoice(lastNames);
}

function generateAvatar(index: number): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=user${index}`;
}

async function insertMockData() {
  const saltRounds = 10;
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const userPromises: Promise<number>[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const nickname = `用户${i}`;
    const phone = generatePhone();
    const realName = generateName();
    const gender = randomChoice(genders);
    const sleepTime = randomChoice(sleepTimes);
    const wakeTime = randomChoice(wakeTimes);
    const hasPet = Math.random() > 0.7;
    const petType = hasPet ? randomChoice(petTypes) : '无';
    const smoking = randomChoice(smokingOptions);
    const genderPreference = Math.random() > 0.6 ? randomChoice(genders) : 'any';
    const cleaningFrequency = randomChoice(cleaningFrequencies);
    const socialPreference = randomChoice(socialPreferences);
    const realNameVerified = Math.random() > 0.2;
    const idCard = realNameVerified ? `110101199${randomInt(0, 9)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}` : null;
    const avatar = generateAvatar(i);

    const promise = new Promise<number>((resolve, reject) => {
      db.run(
        `INSERT INTO users (phone, nickname, avatar, password_hash, real_name_verified, id_card, real_name, 
         sleep_time, wake_time, has_pet, pet_type, smoking, gender_preference, 
         cleaning_frequency, social_preference, gender)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [phone, nickname, avatar, hashedPassword, realNameVerified ? 1 : 0, idCard, realName,
         sleepTime, wakeTime, hasPet ? 1 : 0, petType, smoking, genderPreference,
         cleaningFrequency, socialPreference, gender],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    userPromises.push(promise);
  }

  const userIds = await Promise.all(userPromises);
  console.log(`Inserted ${userIds.length} users`);

  const housePromises: Promise<number>[] = [];
  
  for (let i = 1; i <= 60; i++) {
    const landlordId = randomChoice(userIds);
    const title = randomChoice(houseTitles);
    const location = randomChoice(locations);
    const district = randomChoice(districts);
    const rent = randomInt(1500, 6000);
    const area = randomInt(12, 35);
    const roomType = randomChoice(roomTypes);
    const orientation = randomChoice(orientations);
    const floor = `${randomInt(1, 30)}/${randomInt(10, 40)}层`;
    const expectedSleepTime = randomChoice(sleepTimes);
    const expectedWakeTime = randomChoice(wakeTimes);
    const allowPet = Math.random() > 0.5;
    const allowSmoking = Math.random() > 0.8;
    const genderPreference = Math.random() > 0.5 ? randomChoice(genders) : 'any';
    const maxOccupants = randomInt(1, 3);
    const currentOccupants = randomInt(0, maxOccupants - 1);
    const isRecruitment = currentOccupants > 0 && Math.random() > 0.5;
    
    const photos = JSON.stringify([
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bedroom%20interior%20with%20natural%20light&image_size=square`,
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20living%20room%20shared%20space&image_size=square`,
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20bathroom%20interior&image_size=square`
    ]);
    
    const numFacilities = randomInt(5, 12);
    const selectedFacilities: string[] = [];
    for (let j = 0; j < numFacilities; j++) {
      const facility = randomChoice(facilities);
      if (!selectedFacilities.includes(facility)) {
        selectedFacilities.push(facility);
      }
    }
    const facilitiesStr = JSON.stringify(selectedFacilities);
    
    const description = `${title}，位于${location}，${district}。${roomType}面积${area}平米，${orientation}，${floor}。租金${rent}元/月。配套${selectedFacilities.join('、')}。${isRecruitment ? '现有室友${currentOccupants}人，还需${maxOccupants - currentOccupants}人' : ''}期待作息规律、爱干净的室友！`;

    const promise = new Promise<number>((resolve, reject) => {
      db.run(
        `INSERT INTO houses (landlord_id, title, location, district, rent, area, room_type, orientation, 
         floor, photos, facilities, description, expected_sleep_time, expected_wake_time, 
         allow_pet, allow_smoking, gender_preference, max_occupants, current_occupants, is_recruitment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [landlordId, title, location, district, rent, area, roomType, orientation,
         floor, photos, facilitiesStr, description, expectedSleepTime, expectedWakeTime,
         allowPet ? 1 : 0, allowSmoking ? 1 : 0, genderPreference, maxOccupants, 
         currentOccupants, isRecruitment ? 1 : 0],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    housePromises.push(promise);
  }

  const houseIds = await Promise.all(housePromises);
  console.log(`Inserted ${houseIds.length} houses`);

  for (const houseId of houseIds) {
    const numMatches = randomInt(2, 8);
    const matchedUsers = new Set<number>();
    
    for (let i = 0; i < numMatches; i++) {
      let seekerId = randomChoice(userIds);
      while (matchedUsers.has(seekerId)) {
        seekerId = randomChoice(userIds);
      }
      matchedUsers.add(seekerId);
      
      const sleepScore = randomInt(60, 100);
      const petScore = randomInt(50, 100);
      const smokingScore = randomInt(70, 100);
      const genderScore = randomInt(50, 100);
      const habitScore = randomInt(60, 100);
      const locationScore = randomInt(70, 100);
      const overallScore = Math.round(
        sleepScore * 0.2 + petScore * 0.15 + smokingScore * 0.15 + 
        genderScore * 0.15 + habitScore * 0.2 + locationScore * 0.15
      );

      db.run(
        `INSERT OR IGNORE INTO matches (house_id, seeker_id, overall_score, sleep_score, pet_score, 
         smoking_score, gender_score, habit_score, location_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [houseId, seekerId, overallScore, sleepScore, petScore, smokingScore, 
         genderScore, habitScore, locationScore]
      );
    }
  }

  console.log('Inserted matches');

  const messageContents = [
    '您好，请问房子还在吗？',
    '我对您的房源很感兴趣，可以约个时间看房吗？',
    '您好，我作息规律，不养宠物，不抽烟，符合您的要求',
    '请问租金可以商量吗？',
    '押一付三可以吗？',
    '什么时候方便看房？',
    '周边交通怎么样？',
    '水电费怎么分摊？',
    '有物业费吗？',
    '可以做饭吗？',
    '您好，我想申请入住',
    '已查看房源，非常满意！'
  ];

  for (let i = 0; i < 200; i++) {
    const senderId = randomChoice(userIds);
    let receiverId = randomChoice(userIds);
    while (receiverId === senderId) {
      receiverId = randomChoice(userIds);
    }
    const chatId = [Math.min(senderId, receiverId), Math.max(senderId, receiverId)].join('_');
    const content = randomChoice(messageContents);
    const isRead = Math.random() > 0.3;
    const type = Math.random() > 0.9 ? 'invitation' : 'text';

    db.run(
      `INSERT INTO messages (chat_id, sender_id, receiver_id, content, type, is_read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chatId, senderId, receiverId, content, type, isRead ? 1 : 0]
    );
  }

  console.log('Inserted messages');

  for (let i = 0; i < 10; i++) {
    const houseId = randomChoice(houseIds);
    const partyAId = randomChoice(userIds);
    let partyBId = randomChoice(userIds);
    while (partyBId === partyAId) {
      partyBId = randomChoice(userIds);
    }
    const status = randomChoice(['signed', 'pending', 'draft', 'terminated']);
    const startDate = new Date(2024, randomInt(0, 11), randomInt(1, 28));
    const endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
    const signedAt = status === 'signed' ? new Date() : null;

    db.run(
      `INSERT INTO agreements (house_id, party_a_id, party_b_id, content, public_area_rules, 
       cost_sharing, penalty_terms, start_date, end_date, signature_a, signature_b, signed_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [houseId, partyAId, partyBId, 
       '室友合租协议，双方友好协商达成以下协议条款...',
       '公共区域轮流打扫，保持整洁；禁止大声喧哗影响他人休息；使用公共设施后归位...',
       '房租按月缴纳，每月5号前支付；水电费按人头分摊；网费、物业费共同承担...',
       '提前退房需提前1个月通知；损坏物品照价赔偿；违反协议条款需支付违约金...',
       startDate.toISOString().split('T')[0],
       endDate.toISOString().split('T')[0],
       status === 'signed' ? 'signature_a_' + i : null,
       status === 'signed' ? 'signature_b_' + i : null,
       signedAt ? signedAt.toISOString() : null,
       status]
    );
  }

  console.log('Inserted agreements');

  const disputeTypes = [
    '噪音纠纷', '卫生问题', '费用分摊', '物品损坏', '宠物问题',
    '吸烟问题', '访客问题', '空调使用', '作息时间', '公共区域使用'
  ];

  for (let i = 0; i < 8; i++) {
    const houseId = randomChoice(houseIds);
    const applicantId = randomChoice(userIds);
    let respondentId = randomChoice(userIds);
    while (respondentId === applicantId) {
      respondentId = randomChoice(userIds);
    }
    const type = randomChoice(disputeTypes);
    const status = randomChoice(['pending', 'mediating', 'resolved', 'closed']);
    const description = `关于${type}的纠纷申请。申请人认为被申请人的行为严重影响了其正常居住环境...`;
    const evidences = JSON.stringify([
      '聊天记录截图', '现场照片', '录音文件'
    ]);

    db.run(
      `INSERT INTO disputes (house_id, applicant_id, respondent_id, type, description, 
       evidences, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [houseId, applicantId, respondentId, type, description, evidences, status]
    );
  }

  console.log('Inserted disputes');

  const demoUserPassword = await bcrypt.hash('123456', saltRounds);
  db.run(
    `INSERT INTO users (phone, nickname, avatar, password_hash, real_name_verified, 
     real_name, sleep_time, wake_time, has_pet, pet_type, smoking, 
     cleaning_frequency, social_preference, gender)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['13800138000', '测试用户', generateAvatar(999), demoUserPassword, 1,
     '张三', '23:00', '07:30', 0, '无', 'never',
     '每周', '偶尔社交', 'male'],
    function(err) {
      if (err) {
        console.log('Demo user may already exist');
      } else {
        console.log('Created demo user: 13800138000 / 123456');
      }
    }
  );

  console.log('Mock data insertion complete');
  db.close();
}

insertMockData().catch(console.error);
