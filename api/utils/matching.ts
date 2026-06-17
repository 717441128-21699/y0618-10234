import type { User, House, Match, MatchReason } from '../../shared/types.js';

function timeToMinutes(time: string): number {
  if (!time) return 23 * 60;
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 23 * 60;
  return hours * 60 + minutes;
}

function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const SLEEP_WEIGHT = 0.20;
const PET_WEIGHT = 0.15;
const SMOKING_WEIGHT = 0.15;
const GENDER_WEIGHT = 0.15;
const HABIT_WEIGHT = 0.20;
const LOCATION_WEIGHT = 0.15;

interface DimResult {
  score: number;
  positives: string[];
  negatives: string[];
}

function calcSleep(seeker: User, house: House): DimResult {
  const positives: string[] = [];
  const negatives: string[] = [];
  const seekerSleep = timeToMinutes(seeker.sleepTime || '23:00');
  const expectedSleep = timeToMinutes(house.expectedSleepTime || '23:00');
  const diffMin = Math.abs(seekerSleep - expectedSleep);
  const diffLabel = `${minutesToLabel(seekerSleep)} vs 期望 ${minutesToLabel(expectedSleep)}`;

  let score = 60;
  if (diffMin <= 30) {
    score = 100;
    positives.push(`作息高度一致（${diffLabel}，相差≤30分钟）`);
  } else if (diffMin <= 60) {
    score = 88;
    positives.push(`作息基本一致（${diffLabel}，相差1小时内）`);
  } else if (diffMin <= 90) {
    score = 75;
    positives.push(`作息差异可接受（${diffLabel}，相差1.5小时）`);
  } else if (diffMin <= 120) {
    score = 62;
    negatives.push(`作息存在差异（${diffLabel}，相差2小时）`);
  } else if (diffMin <= 180) {
    score = 45;
    negatives.push(`作息差异较大（${diffLabel}，相差3小时），可能互相干扰`);
  } else {
    score = 25;
    negatives.push(`作息严重不匹配（${diffLabel}，相差超3小时）`);
  }
  return { score, positives, negatives };
}

function calcPet(seeker: User, house: House): DimResult {
  const positives: string[] = [];
  const negatives: string[] = [];
  let score = 70;

  const allowPet = !!house.allowPet;
  const hasPet = !!seeker.hasPet;
  const petTypeLabel = seeker.petType ? `（${seeker.petType}）` : '';

  if (allowPet && hasPet) {
    score = 100;
    positives.push(`房源允许养宠物，您有宠物${petTypeLabel}，完全兼容`);
  } else if (allowPet && !hasPet) {
    score = 88;
    positives.push(`房源允许养宠物，您暂无宠物，无冲突`);
  } else if (!allowPet && !hasPet) {
    score = 100;
    positives.push(`房源不允许宠物，您暂无宠物，完全一致`);
  } else if (!allowPet && hasPet) {
    score = 20;
    negatives.push(`房源明确禁止养宠物，但您有宠物${petTypeLabel}，不兼容`);
  }
  return { score, positives, negatives };
}

function calcSmoking(seeker: User, house: House): DimResult {
  const positives: string[] = [];
  const negatives: string[] = [];
  let score = 70;

  const allowSmoking = !!house.allowSmoking;
  const smoking = seeker.smoking || 'never';
  const smokingLabel = smoking === 'never' ? '不吸烟' : smoking === 'occasionally' ? '偶尔吸烟' : '经常吸烟';

  if (allowSmoking) {
    if (smoking === 'often') {
      score = 100; positives.push(`房源允许吸烟，您${smokingLabel}，无冲突`);
    } else if (smoking === 'occasionally') {
      score = 93; positives.push(`房源允许吸烟，您${smokingLabel}，无冲突`);
    } else {
      score = 82; positives.push(`房源允许吸烟，您${smokingLabel}，您无需担心被限制`);
    }
  } else {
    if (smoking === 'never') {
      score = 100; positives.push(`房源禁烟，您${smokingLabel}，完全一致`);
    } else if (smoking === 'occasionally') {
      score = 48; negatives.push(`房源禁烟，您${smokingLabel}，需额外注意`);
    } else {
      score = 18; negatives.push(`房源禁烟，您${smokingLabel}，存在明显冲突`);
    }
  }
  return { score, positives, negatives };
}

function calcGender(seeker: User, house: House): DimResult {
  const positives: string[] = [];
  const negatives: string[] = [];
  let score = 70;

  const pref = house.genderPreference || 'any';
  const gender = seeker.gender;
  const genderLabel = gender === 'male' ? '男' : gender === 'female' ? '女' : '未设置';
  const prefLabel = pref === 'male' ? '仅男生' : pref === 'female' ? '仅女生' : '不限性别';

  if (pref === 'any') {
    score = 100; positives.push(`房东性别偏好${prefLabel}，无限制`);
  } else if (!gender) {
    score = 60; negatives.push(`房东要求${prefLabel}，您未设置性别，请完善资料`);
  } else if (pref === gender) {
    score = 100; positives.push(`性别符合要求（要求${prefLabel}，您是${genderLabel}）`);
  } else {
    score = 22; negatives.push(`性别不匹配（要求${prefLabel}，您是${genderLabel}）`);
  }
  return { score, positives, negatives };
}

const CLEAN_CONFIG: Record<string, { points: number; label: string }> = {
  '每天': { points: 50, label: '每天打扫' },
  '每周2-3次': { points: 35, label: '每周2-3次' },
  '每周1次': { points: 20, label: '每周1次' },
  '每月1次': { points: 5, label: '每月1次' },
};

const SOCIAL_CONFIG: Record<string, { points: number; label: string }> = {
  '喜欢社交': { points: 32, label: '喜欢社交' },
  '适度社交': { points: 38, label: '适度社交（最受欢迎）' },
  '喜欢独处': { points: 22, label: '喜欢独处' },
  '偶尔社交': { points: 34, label: '偶尔社交' },
  '看情况': { points: 28, label: '看情况' },
};

function resolveCleaning(val: string | undefined): { points: number; label: string } {
  if (!val) return { points: 0, label: '未设置' };
  if (CLEAN_CONFIG[val]) return CLEAN_CONFIG[val];
  if (val.includes('天')) return CLEAN_CONFIG['每天'];
  if (val.includes('2') || val.includes('3')) return CLEAN_CONFIG['每周2-3次'];
  if (val.includes('周') && val.includes('1')) return CLEAN_CONFIG['每周1次'];
  if (val.includes('月')) return CLEAN_CONFIG['每月1次'];
  return { points: 18, label: val };
}

function resolveSocial(val: string | undefined): { points: number; label: string } {
  if (!val) return { points: 0, label: '未设置' };
  if (SOCIAL_CONFIG[val]) return SOCIAL_CONFIG[val];
  if (val.includes('独')) return SOCIAL_CONFIG['喜欢独处'];
  if (val.includes('适度') || val.includes('偶尔')) return SOCIAL_CONFIG['适度社交'];
  if (val.includes('喜') && val.includes('社')) return SOCIAL_CONFIG['喜欢社交'];
  return { points: 26, label: val };
}

interface HabitResult extends DimResult {
  cleaningScore: number;
  socialScore: number;
  cleaningLabel: string;
  socialLabel: string;
}

function calcHabit(seeker: User, _house: House): HabitResult {
  const positives: string[] = [];
  const negatives: string[] = [];

  const cleaning = resolveCleaning(seeker.cleaningFrequency);
  const social = resolveSocial(seeker.socialPreference);

  if (cleaning.points >= 35) {
    positives.push(`清洁习惯好（${cleaning.label}），公共区域卫生有保障 +${cleaning.points}`);
  } else if (cleaning.points >= 15) {
    positives.push(`清洁频率一般（${cleaning.label}） +${cleaning.points}`);
  } else if (cleaning.points > 0) {
    negatives.push(`清洁频率偏低（${cleaning.label}），可能需室友多承担 +${cleaning.points}`);
  } else {
    negatives.push(`清洁频率未设置，请完善档案（此项仅+0）`);
  }

  if (social.points >= 34) {
    positives.push(`社交偏好${social.label}，容易相处 +${social.points}`);
  } else if (social.points >= 25) {
    positives.push(`社交偏好${social.label}，保持适当边界 +${social.points}`);
  } else if (social.points > 0) {
    negatives.push(`社交偏好${social.label}，需室友尊重个人空间 +${social.points}`);
  } else {
    negatives.push(`社交偏好未设置，请完善档案（此项仅+0）`);
  }

  const rawScore = 12 + cleaning.points + social.points;
  const score = Math.min(100, Math.max(10, Math.round(rawScore)));

  return {
    score,
    positives,
    negatives,
    cleaningScore: cleaning.points,
    socialScore: social.points,
    cleaningLabel: cleaning.label,
    socialLabel: social.label,
  };
}

interface LocResult extends DimResult {
  districtLabel: string;
}

function calcLocation(_seeker: User, house: House): LocResult {
  const positives: string[] = [];
  const negatives: string[] = [];
  const district = house.district || '未知区域';

  const districtScores: Record<string, { score: number; note: string }> = {
    '朝阳区': { score: 100, note: '核心繁华地段，交通便利，配套成熟' },
    '海淀区': { score: 95, note: '科教核心区，临近高校和科技园区' },
    '西城区': { score: 92, note: '传统中心城区，配套完善' },
    '东城区': { score: 90, note: '中心城区，交通便捷' },
    '丰台区': { score: 82, note: '南城核心，性价比高' },
    '通州区': { score: 78, note: '城市副中心，发展快但通勤略远' },
  };

  const cfg = districtScores[district];
  let score: number;
  if (cfg) {
    score = cfg.score;
    if (score >= 90) positives.push(`${district}：${cfg.note}`);
    else if (score >= 80) positives.push(`${district}：${cfg.note}`);
    else negatives.push(`${district}：${cfg.note}`);
  } else {
    score = 72;
    positives.push(`${district}，地段评分一般`);
  }

  return { score, positives, negatives, districtLabel: district };
}

export interface MatchCalcResult extends Omit<Match, 'id' | 'houseId' | 'seekerId' | 'createdAt'> {
  reasons: MatchReason[];
  habitBreakdown: {
    cleaningScore: number;
    socialScore: number;
    cleaningLabel: string;
    socialLabel: string;
  };
}

export function calculateMatchScore(seeker: User, house: House): MatchCalcResult {
  const sleep = calcSleep(seeker, house);
  const pet = calcPet(seeker, house);
  const smoking = calcSmoking(seeker, house);
  const gender = calcGender(seeker, house);
  const habit = calcHabit(seeker, house);
  const location = calcLocation(seeker, house);

  const overallScore = Math.round(
    sleep.score * SLEEP_WEIGHT +
    pet.score * PET_WEIGHT +
    smoking.score * SMOKING_WEIGHT +
    gender.score * GENDER_WEIGHT +
    habit.score * HABIT_WEIGHT +
    location.score * LOCATION_WEIGHT
  );

  const reasons: MatchReason[] = [
    {
      key: 'sleepScore', label: '作息匹配', icon: '🌙',
      score: sleep.score, weight: SLEEP_WEIGHT,
      weightedScore: Math.round(sleep.score * SLEEP_WEIGHT),
      positives: sleep.positives, negatives: sleep.negatives,
    },
    {
      key: 'petScore', label: '宠物偏好', icon: '🐾',
      score: pet.score, weight: PET_WEIGHT,
      weightedScore: Math.round(pet.score * PET_WEIGHT),
      positives: pet.positives, negatives: pet.negatives,
    },
    {
      key: 'smokingScore', label: '吸烟习惯', icon: '🚭',
      score: smoking.score, weight: SMOKING_WEIGHT,
      weightedScore: Math.round(smoking.score * SMOKING_WEIGHT),
      positives: smoking.positives, negatives: smoking.negatives,
    },
    {
      key: 'genderScore', label: '性别偏好', icon: '👤',
      score: gender.score, weight: GENDER_WEIGHT,
      weightedScore: Math.round(gender.score * GENDER_WEIGHT),
      positives: gender.positives, negatives: gender.negatives,
    },
    {
      key: 'habitScore', label: '生活习惯', icon: '🏠',
      score: habit.score, weight: HABIT_WEIGHT,
      weightedScore: Math.round(habit.score * HABIT_WEIGHT),
      positives: habit.positives, negatives: habit.negatives,
    },
    {
      key: 'locationScore', label: '地段评分', icon: '📍',
      score: location.score, weight: LOCATION_WEIGHT,
      weightedScore: Math.round(location.score * LOCATION_WEIGHT),
      positives: location.positives, negatives: location.negatives,
    },
  ];

  const habitBreakdown = {
    cleaningScore: habit.cleaningScore,
    socialScore: habit.socialScore,
    cleaningLabel: habit.cleaningLabel,
    socialLabel: habit.socialLabel,
  };

  return {
    overallScore,
    sleepScore: sleep.score,
    petScore: pet.score,
    smokingScore: smoking.score,
    genderScore: gender.score,
    habitScore: habit.score,
    locationScore: location.score,
    reasons,
    habitBreakdown,
  };
}

export function getMatchLevel(score: number): { level: string; color: string } {
  if (score >= 90) return { level: '极佳匹配', color: '#4ECDC4' };
  if (score >= 80) return { level: '优质匹配', color: '#4ECDC4' };
  if (score >= 70) return { level: '良好匹配', color: '#FFD93D' };
  if (score >= 60) return { level: '一般匹配', color: '#FFB347' };
  return { level: '匹配度较低', color: '#FF6B6B' };
}
