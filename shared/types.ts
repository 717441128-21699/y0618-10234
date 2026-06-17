export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar: string;
  realNameVerified: boolean;
  idCard?: string;
  realName?: string;
  sleepTime?: string;
  wakeTime?: string;
  hasPet: boolean;
  petType?: string;
  smoking: 'never' | 'occasionally' | 'often';
  genderPreference?: 'male' | 'female' | 'any';
  cleaningFrequency?: string;
  socialPreference?: string;
  gender?: 'male' | 'female';
  createdAt: Date;
}

export interface House {
  id: number;
  landlordId: number;
  title: string;
  location: string;
  district: string;
  rent: number;
  area: number;
  roomType: string;
  orientation: string;
  floor: string;
  photos: string[];
  facilities: string[];
  description: string;
  expectedSleepTime?: string;
  expectedWakeTime?: string;
  allowPet: boolean;
  allowSmoking: boolean;
  genderPreference: 'male' | 'female' | 'any';
  maxOccupants: number;
  currentOccupants: number;
  isRecruitment: boolean;
  createdAt: Date;
  landlord?: User;
  matchScore?: number;
}

export interface Match {
  id: number;
  houseId: number;
  seekerId: number;
  overallScore: number;
  sleepScore: number;
  petScore: number;
  smokingScore: number;
  genderScore: number;
  habitScore: number;
  locationScore: number;
  createdAt: Date;
  house?: House;
  seeker?: User;
}

export interface Message {
  id: number;
  chatId: string;
  senderId: number;
  receiverId: number;
  content: string;
  type: 'text' | 'image' | 'invitation' | 'agreement';
  isRead: boolean;
  createdAt: Date;
  sender?: User;
  receiver?: User;
}

export interface ChatSession {
  chatId: string;
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
  matchScore?: number;
}

export interface Agreement {
  id: number;
  houseId: number;
  partyAId: number;
  partyBId: number;
  content: string;
  publicAreaRules: string;
  costSharing: string;
  penaltyTerms: string;
  startDate: Date;
  endDate: Date;
  signatureA?: string;
  signatureB?: string;
  signedAt?: Date;
  status: 'draft' | 'pending' | 'signed' | 'terminated';
  createdAt: Date;
  house?: House;
  partyA?: User;
  partyB?: User;
}

export interface Dispute {
  id: number;
  houseId: number;
  applicantId: number;
  respondentId: number;
  type: string;
  description: string;
  evidences: string[];
  mediatorId?: number;
  status: 'pending' | 'mediating' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: Date;
  house?: House;
  applicant?: User;
  respondent?: User;
}

export interface MediationMessage {
  id: number;
  disputeId: number;
  senderId: number;
  senderRole: 'applicant' | 'respondent' | 'mediator';
  content: string;
  createdAt: Date;
  sender?: User;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  nickname: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
  sleepTime?: string;
  wakeTime?: string;
  hasPet?: boolean;
  petType?: string;
  smoking?: 'never' | 'occasionally' | 'often';
  genderPreference?: 'male' | 'female' | 'any';
  cleaningFrequency?: string;
  socialPreference?: string;
  gender?: 'male' | 'female';
}

export interface CreateHouseRequest {
  title: string;
  location: string;
  district: string;
  rent: number;
  area: number;
  roomType: string;
  orientation: string;
  floor: string;
  photos: string[];
  facilities: string[];
  description: string;
  expectedSleepTime?: string;
  expectedWakeTime?: string;
  allowPet: boolean;
  allowSmoking: boolean;
  genderPreference: 'male' | 'female' | 'any';
  maxOccupants: number;
  currentOccupants: number;
  isRecruitment: boolean;
}

export interface CreateDisputeRequest {
  houseId: number;
  respondentId: number;
  type: string;
  description: string;
  evidences: string[];
}

export interface CreateAgreementRequest {
  houseId: number;
  partyBId: number;
  content: string;
  publicAreaRules: string;
  costSharing: string;
  penaltyTerms: string;
  startDate: string;
  endDate: string;
}

export interface SignAgreementRequest {
  signature: string;
}
