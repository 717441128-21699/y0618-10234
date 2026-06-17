import type {
  User,
  House,
  Match,
  Message,
  ChatSession,
  Agreement,
  Dispute,
  MediationMessage,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateProfileRequest,
  CreateHouseRequest,
  CreateDisputeRequest,
  CreateAgreementRequest,
  SignAgreementRequest
} from '../../shared/types.js';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authApi = {
  login: (data: LoginRequest) => request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  register: (data: RegisterRequest) => request<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getProfile: () => request<User>('/auth/profile'),
  updateProfile: (data: UpdateProfileRequest) => request<User>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  verifyIdentity: (data: { idCard: string; realName: string }) => request<{ message: string; user: User }>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getUser: (id: number) => request<User>(`/auth/users/${id}`)
};

export const houseApi = {
  getList: (params?: {
    district?: string;
    minRent?: number;
    maxRent?: number;
    roomType?: string;
    allowPet?: boolean;
    allowSmoking?: boolean;
    isRecruitment?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }
    return request<House[]>(`/houses${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getMyHouses: () => request<House[]>('/houses/me'),
  getDetail: (id: number) => request<House>(`/houses/${id}`),
  create: (data: CreateHouseRequest) => request<{ id: number; message: string }>('/houses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: number, data: Partial<CreateHouseRequest>) => request<{ message: string }>(`/houses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: number) => request<{ message: string }>(`/houses/${id}`, {
    method: 'DELETE'
  })
};

export const matchApi = {
  getMyMatches: () => request<Match[]>('/matches'),
  getHouseMatches: (houseId: number) => request<Match[]>(`/matches/house/${houseId}`),
  getDetail: (id: number) => request<Match>(`/matches/${id}`),
  calculate: (houseId: number) => request<Match>(`/matches/calculate/${houseId}`)
};

export const chatApi = {
  getSessions: () => request<ChatSession[]>('/chat/sessions'),
  getMessages: (otherUserId: number) => request<Message[]>(`/chat/${otherUserId}`),
  sendMessage: (data: { receiverId: number; content: string; type?: string }) => request<Message>('/chat/send', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  markAsRead: (otherUserId: number) => request<{ message: string }>(`/chat/read/${otherUserId}`, {
    method: 'POST'
  }),
  getUnreadCount: () => request<{ count: number }>('/chat/unread/count')
};

export const agreementApi = {
  getList: () => request<Agreement[]>('/agreements'),
  getDetail: (id: number) => request<Agreement>(`/agreements/${id}`),
  create: (data: CreateAgreementRequest) => request<{ id: number; message: string }>('/agreements', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  sign: (id: number, data: SignAgreementRequest) => request<{ message: string; agreement: Agreement }>(`/agreements/${id}/sign`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  terminate: (id: number) => request<{ message: string }>(`/agreements/${id}/terminate`, {
    method: 'POST'
  })
};

export const disputeApi = {
  getList: () => request<Dispute[]>('/disputes'),
  getDetail: (id: number) => request<Dispute>(`/disputes/${id}`),
  getMessages: (id: number) => request<MediationMessage[]>(`/disputes/${id}/messages`),
  create: (data: CreateDisputeRequest) => request<{ id: number; message: string }>('/disputes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  sendMessage: (id: number, content: string) => request<{ message: string }>(`/disputes/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  resolve: (id: number, resolution: string) => request<{ message: string }>(`/disputes/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution })
  }),
  close: (id: number) => request<{ message: string }>(`/disputes/${id}/close`, {
    method: 'POST'
  })
};
