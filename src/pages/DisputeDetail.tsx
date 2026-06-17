import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, AlertTriangle, CheckCircle, Clock, XCircle,
  Home, User, FileText, Image, Send as SendIcon,
  MessageCircle, Shield, X
} from 'lucide-react';
import { disputeApi, houseApi, authApi } from '../api/client.js';
import type { Dispute, MediationMessage, House, User as UserType } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDisputeStatus, getDisputeStatusColor, formatDate, formatDateTime } from '../utils/match.js';

const disputeTypeOptions = [
  { value: 'rent', label: '租金分摊', icon: '💰' },
  { value: 'utility', label: '水电费用', icon: '💡' },
  { value: 'cleaning', label: '公共卫生', icon: '🧹' },
  { value: 'noise', label: '噪音干扰', icon: '🔊' },
  { value: 'pet', label: '宠物问题', icon: '🐾' },
  { value: 'smoking', label: '吸烟问题', icon: '🚬' },
  { value: 'sleep', label: '作息冲突', icon: '😴' },
  { value: 'other', label: '其他问题', icon: '❓' },
];

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<MediationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    houseId: '',
    respondentId: searchParams.get('respondentId') || '',
    type: '',
    description: '',
    evidences: [] as string[]
  });
  const [houses, setHouses] = useState<House[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const isCreateMode = id === 'create';

  useEffect(() => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }

    if (isCreateMode) {
      fetchCreateData();
    } else if (id) {
      fetchDisputeData(parseInt(id));
    }
  }, [id, user, navigate, isCreateMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCreateData = async () => {
    setLoading(true);
    try {
      const myHouses = await houseApi.getMyHouses();
      setHouses(myHouses);
    } catch (error) {
      console.error('Failed to fetch create data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeData = async (disputeId: number) => {
    setLoading(true);
    try {
      const [disputeData, messagesData] = await Promise.all([
        disputeApi.getDetail(disputeId),
        disputeApi.getMessages(disputeId)
      ]);
      setDispute(disputeData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to fetch dispute data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseChange = async (houseId: string) => {
    setFormData(prev => ({ ...prev, houseId }));
    if (houseId && user) {
      try {
        const house = houses.find(h => h.id === parseInt(houseId));
        if (house && house.landlordId !== user.id) {
          const landlord = await authApi.getUser(house.landlordId);
          setUsers([landlord]);
          setFormData(prev => ({ ...prev, respondentId: String(landlord.id) }));
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.houseId || !formData.respondentId || !formData.type || !formData.description) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await disputeApi.create({
        houseId: parseInt(formData.houseId),
        respondentId: parseInt(formData.respondentId),
        type: formData.type,
        description: formData.description,
        evidences: formData.evidences
      });
      navigate(`/disputes/${result.id}`);
    } catch (error) {
      console.error('Failed to create dispute:', error);
      alert('发起纠纷失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !id || sending || isCreateMode) return;

    setSending(true);
    try {
      await disputeApi.sendMessage(parseInt(id), input.trim());
      setInput('');
      await fetchDisputeData(parseInt(id));
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResolve = async () => {
    if (!id || !resolution.trim() || resolving) return;

    setResolving(true);
    try {
      await disputeApi.resolve(parseInt(id), resolution.trim());
      setShowResolveModal(false);
      await fetchDisputeData(parseInt(id));
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      alert('解决纠纷失败，请重试');
    } finally {
      setResolving(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    if (!confirm('确定要关闭此纠纷吗？关闭后将无法继续调解。')) return;

    try {
      await disputeApi.close(parseInt(id));
      await fetchDisputeData(parseInt(id));
    } catch (error) {
      console.error('Failed to close dispute:', error);
      alert('关闭纠纷失败，请重试');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'mediating': return <MessageCircle className="w-5 h-5" />;
      case 'closed': return <XCircle className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'applicant': return '申请人';
      case 'respondent': return '被申请人';
      case 'mediator': return '调解员';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'applicant': return 'bg-orange-100 text-orange-600';
      case 'respondent': return 'bg-blue-100 text-blue-600';
      case 'mediator': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (!user?.realNameVerified) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] animate-pulse" />
      </div>
    );
  }

  if (isCreateMode) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/disputes')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回纠纷列表
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mr-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">发起纠纷调解</h1>
              <p className="text-gray-500">请如实填写纠纷信息，平台将安排专业调解员介入</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择房源 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.houseId}
                onChange={(e) => handleHouseChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                required
              >
                <option value="">请选择涉及的房源</option>
                {houses.map(house => (
                  <option key={house.id} value={house.id}>{house.title}</option>
                ))}
              </select>
            </div>

            {formData.houseId && users.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  被申请人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.respondentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, respondentId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">请选择被申请人</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nickname}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                纠纷类型 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {disputeTypeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: opt.value }))}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.type === opt.value
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="text-sm font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                纠纷详情描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请详细描述纠纷的起因、经过和您的诉求..."
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all resize-none"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">平台调解须知</p>
                  <ul className="space-y-1 text-blue-600">
                    <li>• 请如实填写纠纷信息，提供相关证据有助于调解</li>
                    <li>• 调解员将在24小时内介入，保持通讯畅通</li>
                    <li>• 调解过程中请保持理性，尊重对方和调解员</li>
                    <li>• 调解成功后可签订和解协议，具有法律效力</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/disputes')}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.houseId || !formData.respondentId || !formData.type || !formData.description}
                className="px-8 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <SendIcon className="w-5 h-5" />
                    <span>提交纠纷</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">纠纷不存在或已被删除</p>
        <button
          onClick={() => navigate('/disputes')}
          className="mt-4 text-orange-500 hover:text-orange-600"
        >
          返回纠纷列表
        </button>
      </div>
    );
  }

  const isApplicant = dispute.applicantId === user.id;
  const isRespondent = dispute.respondentId === user.id;
  const canSendMessage = dispute.status === 'mediating' || dispute.status === 'pending';
  const canResolve = (isApplicant || isRespondent) && dispute.status === 'mediating';
  const canClose = (isApplicant || isRespondent) && (dispute.status === 'mediating' || dispute.status === 'pending');

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/disputes')}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回纠纷列表
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-xl font-bold text-gray-800">
                  {disputeTypeOptions.find(t => t.value === dispute.type)?.label || dispute.type}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getDisputeStatusColor(dispute.status)}`}>
                  {getStatusIcon(dispute.status)}
                  <span>{formatDisputeStatus(dispute.status)}</span>
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                  {isApplicant ? '申请人' : '被申请人'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                纠纷编号：#{dispute.id} · 发起时间：{formatDate(dispute.createdAt)}
              </p>
            </div>

            <div className="flex space-x-2">
              {canResolve && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="px-4 py-2 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-all flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>标记解决</span>
                </button>
              )}
              {canClose && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>关闭</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Home className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">涉及房源</p>
                <p className="font-medium text-gray-800">{dispute.house?.title || '未知房源'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">申请人</p>
                <p className="font-medium text-gray-800">{dispute.applicant?.nickname || '未知用户'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">被申请人</p>
                <p className="font-medium text-gray-800">{dispute.respondent?.nickname || '未知用户'}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">纠纷详情</p>
            <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
              {dispute.description}
            </p>
          </div>
        </div>

        {dispute.resolution && (
          <div className="p-6 border-t border-gray-100 bg-green-50">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 mb-1">解决方案</p>
                <p className="text-green-700">{dispute.resolution}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-orange-500" />
            调解对话
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isMine = msg.senderId === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <img
                      src={msg.sender?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt=""
                      className="w-8 h-8 rounded-lg mr-2 flex-shrink-0"
                    />
                  )}
                  <div className={`max-w-[70%] ${isMine ? 'order-first' : ''}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {!isMine && (
                        <>
                          <span className="text-sm font-medium text-gray-700">
                            {msg.sender?.nickname || '未知用户'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(msg.senderRole)}`}>
                            {getRoleLabel(msg.senderRole)}
                          </span>
                        </>
                      )}
                      {isMine && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(msg.senderRole)}`}>
                          {getRoleLabel(msg.senderRole)}
                        </span>
                      )}
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-br-md'
                          : msg.senderRole === 'mediator'
                            ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-bl-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                      {formatDateTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-orange-300" />
              </div>
              <p className="text-gray-500 mb-2">
                {dispute.status === 'pending' ? '等待调解员介入...' : '开始调解对话'}
              </p>
              <p className="text-sm text-gray-400">
                {dispute.status === 'pending' 
                  ? '调解员将在24小时内联系双方，请耐心等待'
                  : '请理性沟通，共同寻求解决方案'
                }
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {canSendMessage && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-end space-x-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                rows={1}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all resize-none"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || sending}
                className="px-5 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">标记纠纷已解决</h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                解决方案说明
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="请简要描述解决方案..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution.trim() || resolving}
                className="flex-1 px-4 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {resolving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>确认解决</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
