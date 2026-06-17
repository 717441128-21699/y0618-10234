import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, User, Calendar, DollarSign,
  CheckCircle, Clock, AlertCircle, PenLine, Home
} from 'lucide-react';
import { agreementApi, houseApi, authApi } from '../api/client.js';
import type { Agreement, House, User as UserType } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatAgreementStatus, getAgreementStatusColor, formatDate } from '../utils/match.js';

export default function AgreementDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [form, setForm] = useState({
    houseId: searchParams.get('houseId') || '',
    partyBId: searchParams.get('partyBId') || '',
    publicAreaRules: '',
    costSharing: '',
    penaltyTerms: '',
    startDate: '',
    endDate: '',
  });
  const [houses, setHouses] = useState<House[]>([]);
  const [partyB, setPartyB] = useState<UserType | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }

    if (id === 'create') {
      setIsCreateMode(true);
      loadCreateData();
    } else if (id) {
      loadAgreementDetail(parseInt(id));
    }
  }, [id, user, navigate]);

  const loadCreateData = async () => {
    try {
      const [myHouses] = await Promise.all([
        houseApi.getMyHouses(),
        form.partyBId ? authApi.getUser(parseInt(form.partyBId)) : Promise.resolve(null)
      ]);
      setHouses(myHouses);
      if (form.partyBId) {
        const pb = await authApi.getUser(parseInt(form.partyBId));
        setPartyB(pb);
      }
    } catch (error) {
      console.error('Failed to load create data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgreementDetail = async (agreementId: number) => {
    setLoading(true);
    try {
      const data = await agreementApi.getDetail(agreementId);
      setAgreement(data);
    } catch (error) {
      console.error('Failed to fetch agreement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.houseId || !form.partyBId || !form.startDate || !form.endDate) {
      setError('请填写完整信息');
      return;
    }

    try {
      const result = await agreementApi.create({
        houseId: parseInt(form.houseId),
        partyBId: parseInt(form.partyBId),
        content: '室友合租协议',
        publicAreaRules: form.publicAreaRules,
        costSharing: form.costSharing,
        penaltyTerms: form.penaltyTerms,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      
      navigate(`/agreements/${result.id}`);
    } catch (err: any) {
      setError(err.message || '创建失败，请稍后重试');
    }
  };

  const handleSign = async () => {
    if (!id || !signature.trim()) return;

    setSigning(true);
    try {
      await agreementApi.sign(parseInt(id), { signature: signature.trim() });
      await loadAgreementDetail(parseInt(id));
      setShowSignModal(false);
      setSignature('');
    } catch (error) {
      console.error('Failed to sign agreement:', error);
    } finally {
      setSigning(false);
    }
  };

  const handleTerminate = async () => {
    if (!id) return;
    if (!confirm('确定要终止这份协议吗？终止后将无法恢复。')) return;

    try {
      await agreementApi.terminate(parseInt(id));
      await loadAgreementDetail(parseInt(id));
    } catch (error) {
      console.error('Failed to terminate agreement:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] animate-pulse" />
      </div>
    );
  }

  if (isCreateMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/agreements')}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回协议列表</span>
        </button>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-orange-500" />
            创建室友协议
          </h1>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择房源 *</label>
                <select
                  value={form.houseId}
                  onChange={(e) => setForm({ ...form, houseId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                >
                  <option value="">请选择房源</option>
                  {houses.map(h => (
                    <option key={h.id} value={h.id}>{h.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">协议乙方 *</label>
                {partyB ? (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center space-x-3">
                    <img
                      src={partyB.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt=""
                      className="w-8 h-8 rounded-lg"
                    />
                    <span className="font-medium text-gray-800">{partyB.nickname}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={form.partyBId}
                    onChange={(e) => setForm({ ...form, partyBId: e.target.value })}
                    placeholder="输入对方用户ID"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                  />
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1 text-orange-500" />
                  开始日期 *
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1 text-orange-500" />
                  结束日期 *
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">公共区域使用规则</label>
              <textarea
                value={form.publicAreaRules}
                onChange={(e) => setForm({ ...form, publicAreaRules: e.target.value })}
                rows={4}
                placeholder="例如：客厅使用时间、厨房使用规则、卫生打扫安排等"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1 text-orange-500" />
                费用分摊方式
              </label>
              <textarea
                value={form.costSharing}
                onChange={(e) => setForm({ ...form, costSharing: e.target.value })}
                rows={4}
                placeholder="例如：房租、水电费、网费、物业费等分摊比例"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">违约条款</label>
              <textarea
                value={form.penaltyTerms}
                onChange={(e) => setForm({ ...form, penaltyTerms: e.target.value })}
                rows={4}
                placeholder="例如：提前退租处理方式、拖欠租金处理、损坏物品赔偿等"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none resize-none"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/agreements')}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all"
              >
                创建协议
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">协议不存在或已被删除</p>
        <button
          onClick={() => navigate('/agreements')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
        >
          返回列表
        </button>
      </div>
    );
  }

  const isPartyA = agreement.partyAId === user?.id;
  const isPartyB = agreement.partyBId === user?.id;
  const needMySignature = (
    agreement.status === 'pending' &&
    ((isPartyA && !agreement.signatureA) || (isPartyB && !agreement.signatureB))
  );
  const canTerminate = (agreement.status === 'signed' && (isPartyA || isPartyB));

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/agreements')}
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回协议列表</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">室友协议</h1>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm`}>
                  {formatAgreementStatus(agreement.status)}
                </span>
                <span className="text-sm text-orange-100">
                  协议编号：{agreement.id.toString().padStart(6, '0')}
                </span>
              </div>
            </div>
            <FileText className="w-16 h-16 text-white/20" />
          </div>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Home className="w-5 h-5 mr-2 text-orange-500" />
                房源信息
              </h3>
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <p className="text-gray-800 font-medium">{agreement.house?.title}</p>
                <p className="text-sm text-gray-500">{agreement.house?.location}</p>
                <p className="text-sm text-gray-500">
                  租金：¥{agreement.house?.rent.toLocaleString()}/月
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                协议期限
              </h3>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-800 font-medium">
                  {formatDate(agreement.startDate)}
                </p>
                <p className="text-sm text-gray-500">至</p>
                <p className="text-gray-800 font-medium">
                  {formatDate(agreement.endDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              协议双方
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border-2 ${
                isPartyA ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">甲方（房东）</span>
                  {agreement.signatureA ? (
                    <span className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已签署
                    </span>
                  ) : agreement.status === 'pending' ? (
                    <span className="text-xs text-yellow-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      待签署
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center space-x-3">
                  <img
                    src={agreement.partyA?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt=""
                    className="w-10 h-10 rounded-xl"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{agreement.partyA?.nickname}</p>
                    {isPartyA && <span className="text-xs text-orange-500">（我）</span>}
                  </div>
                </div>
                {agreement.signatureA && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-xs text-gray-500">签名：</p>
                    <p className="font-medium text-gray-800 font-mono">{agreement.signatureA}</p>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-xl border-2 ${
                isPartyB ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">乙方（租客）</span>
                  {agreement.signatureB ? (
                    <span className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已签署
                    </span>
                  ) : agreement.status === 'pending' ? (
                    <span className="text-xs text-yellow-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      待签署
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center space-x-3">
                  <img
                    src={agreement.partyB?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt=""
                    className="w-10 h-10 rounded-xl"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{agreement.partyB?.nickname}</p>
                    {isPartyB && <span className="text-xs text-orange-500">（我）</span>}
                  </div>
                </div>
                {agreement.signatureB && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-xs text-gray-500">签名：</p>
                    <p className="font-medium text-gray-800 font-mono">{agreement.signatureB}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {agreement.publicAreaRules && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-3">公共区域使用规则</h3>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700 whitespace-pre-wrap">{agreement.publicAreaRules}</p>
              </div>
            </div>
          )}

          {agreement.costSharing && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-3">费用分摊方式</h3>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700 whitespace-pre-wrap">{agreement.costSharing}</p>
              </div>
            </div>
          )}

          {agreement.penaltyTerms && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-3">违约条款</h3>
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-gray-700 whitespace-pre-wrap">{agreement.penaltyTerms}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
            {needMySignature && (
              <button
                onClick={() => setShowSignModal(true)}
                className="px-8 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 transition-all flex items-center space-x-2"
              >
                <PenLine className="w-5 h-5" />
                <span>签署协议</span>
              </button>
            )}
            {canTerminate && (
              <button
                onClick={handleTerminate}
                className="px-8 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all"
              >
                终止协议
              </button>
            )}
          </div>
        </div>
      </div>

      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">签署协议</h3>
            <p className="text-gray-600 mb-6">
              请输入你的签名以确认同意本协议的所有条款。签名后协议将正式生效。
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">电子签名</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="请输入你的姓名作为签名"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowSignModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSign}
                disabled={!signature.trim() || signing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? '签署中...' : '确认签署'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
