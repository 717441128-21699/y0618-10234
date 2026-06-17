import type { User, House, Match } from '../../shared/types.js';

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateSleepScore(seeker: User, house: House): number {
  const seekerSleep = timeToMinutes(seeker.sleepTime || '23:00');
  const expectedSleep = timeToMinutes(house.expectedSleepTime || '23:00');
  const diff = Math.abs(seekerSleep - expectedSleep);
  if (diff <= 30) return 100;
  if (diff <= 60) return 90;
  if (diff <= 120) return 75;
  if (diff <= 180) return 60;
  return 40;
}

function calculatePetScore(seeker: User, house: House): number {
  if (house.allowPet && seeker.hasPet) return 100;
  if (house.allowPet && !seeker.hasPet) return 90;
  if (!house.allowPet && !seeker.hasPet) return 100;
  if (!house.allowPet && seeker.hasPet) return 30;
  return 70;
}

function calculateSmokingScore(seeker: User, house: House): number {
  if (house.allowSmoking) {
    if (seeker.smoking === 'often') return 100;
    if (seeker.smoking === 'occasionally') return 95;
    return 90;
  } else {
    if (seeker.smoking === 'never') return 100;
    if (seeker.smoking === 'occasionally') return 50;
    return 20;
  }
}

function calculateGenderScore(seeker: User, house: House): number {
  if (house.genderPreference === 'any') return 100;
  if (!seeker.gender) return 70;
  return house.genderPreference === seeker.gender ? 100 : 20;
}

function calculateHabitScore(seeker: User, house: House): number {
  let score = 70;
  
  const cleaningMap: Record<string, number> = {
    '每天': 5,
    '每两天': 4,
    '每周': 3,
    '每两周': 2,
    '每月': 1
  };
  
  if (seeker.cleaningFrequency && (cleaningMap[seeker.cleaningFrequency] >= 3)) {
    score += 15;
  } else if (seeker.cleaningFrequency) {
    score -= 10;
  }
  
  const socialMap: Record<string, number> = {
    '喜欢社交': 10,
    '偶尔社交': 15,
    '喜欢独处': 5,
    '看情况': 10
  };
  
  if (seeker.socialPreference) {
    score += socialMap[seeker.socialPreference] || 0;
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculateLocationScore(seeker: User, house: House): number {
  const districtScores: Record<string, number> = {
    '朝阳区': 100,
    '海淀区': 95,
    '西城区': 90,
    '东城区': 88,
    '丰台区': 82,
    '通州区': 78
  };
  
  return districtScores[house.district] || 70;
}

export function calculateMatchScore(seeker: User, house: House): Omit<Match, 'id' | 'houseId' | 'seekerId' | 'createdAt'> {
  const sleepScore = calculateSleepScore(seeker, house);
  const petScore = calculatePetScore(seeker, house);
  const smokingScore = calculateSmokingScore(seeker, house);
  const genderScore = calculateGenderScore(seeker, house);
  const habitScore = calculateHabitScore(seeker, house);
  const locationScore = calculateLocationScore(seeker, house);
  
  const overallScore = Math.round(
    sleepScore * 0.20 +
    petScore * 0.15 +
    smokingScore * 0.15 +
    genderScore * 0.15 +
    habitScore * 0.20 +
    locationScore * 0.15
  );
  
  return {
    overallScore,
    sleepScore,
    petScore,
    smokingScore,
    genderScore,
    habitScore,
    locationScore
  };
}

export function getMatchLevel(score: number): { level: string; color: string } {
  if (score >= 90) return { level: '极佳匹配', color: '#4ECDC4' };
  if (score >= 80) return { level: '优质匹配', color: '#4ECDC4' };
  if (score >= 70) return { level: '良好匹配', color: '#FFD93D' };
  if (score >= 60) return { level: '一般匹配', color: '#FFB347' };
  return { level: '匹配度较低', color: '#FF6B6B' };
}
