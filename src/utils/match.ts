export function getMatchLevel(score: number): { level: string; color: string } {
  if (score >= 90) return { level: '极佳匹配', color: '#4ECDC4' };
  if (score >= 80) return { level: '优质匹配', color: '#4ECDC4' };
  if (score >= 70) return { level: '良好匹配', color: '#FFD93D' };
  if (score >= 60) return { level: '一般匹配', color: '#FFB347' };
  return { level: '匹配度较低', color: '#FF6B6B' };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[#4ECDC4]';
  if (score >= 60) return 'text-[#FFD93D]';
  return 'text-[#FF6B6B]';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-[#4ECDC4]';
  if (score >= 60) return 'bg-[#FFD93D]';
  return 'bg-[#FF6B6B]';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-[#4ECDC4]';
  if (score >= 60) return 'border-[#FFD93D]';
  return 'border-[#FF6B6B]';
}

export function formatTime(time: string | undefined): string {
  if (!time) return '未设置';
  return time;
}

export function formatSmoking(smoking: string): string {
  const map: Record<string, string> = {
    'never': '不吸烟',
    'occasionally': '偶尔吸烟',
    'often': '经常吸烟'
  };
  return map[smoking] || smoking;
}

export function formatGender(gender: string | undefined): string {
  if (!gender) return '未设置';
  return gender === 'male' ? '男' : '女';
}

export function formatGenderPreference(pref: string): string {
  const map: Record<string, string> = {
    'male': '仅限男性',
    'female': '仅限女性',
    'any': '性别不限'
  };
  return map[pref] || pref;
}

export function formatDisputeStatus(status: string): string {
  const map: Record<string, string> = {
    'pending': '等待处理',
    'mediating': '调解中',
    'resolved': '已解决',
    'closed': '已关闭'
  };
  return map[status] || status;
}

export function formatAgreementStatus(status: string): string {
  const map: Record<string, string> = {
    'draft': '草稿',
    'pending': '待签署',
    'signed': '已签署',
    'terminated': '已终止'
  };
  return map[status] || status;
}

export function getDisputeStatusColor(status: string): string {
  const map: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'mediating': 'bg-blue-100 text-blue-800',
    'resolved': 'bg-green-100 text-green-800',
    'closed': 'bg-gray-100 text-gray-800'
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function getAgreementStatusColor(status: string): string {
  const map: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'signed': 'bg-green-100 text-green-800',
    'terminated': 'bg-red-100 text-red-800'
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
