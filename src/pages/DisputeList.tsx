import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, PlusCircle, AlertCircle, Search,
  CheckCircle, Clock, XCircle, ArrowRight, MessageCircle
} from 'lucide-react';
import { disputeApi } from '../api/client.js';
import type { Dispute } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDisputeStatus, getDisputeStatusColor, formatDate } from '../utils/match.js';

const disputeTypeLabels: Record<string, string> = {
  'rent': '租金分摊',
  'utility': '水电费用',
  'cleaning': '公共卫生',
  'noise': '噪音干扰',
  'pet': '宠物问题',
  'smoking': '吸烟问题',
  'sleep': '作息冲突',
  'other': '其他问题'
};

export default function DisputeList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'mediating' | 'resolved' | 'closed'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }

    fetchDisputes();
  }, [user, navigate]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await disputeApi.getList();
      setDisputes(data);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        d.house?.title.toLowerCase().includes(keyword) ||
        d.applicant?.nickname.toLowerCase().includes(keyword) ||
        d.respondent?.nickname.toLowerCase().includes(keyword) ||
        (d.type && disputeTypeLabels[d.type]?.toLowerCase().includes(keyword))
      );
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'mediating': return <MessageCircle className="w-5 h-5" />;
      case 'closed': return <XCircle className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  if (!user?.realNameVerified) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">需要实名认证</h2>
          <p className="text-gray-500 mb-8">纠纷调解功能需要实名认证后才能使用，请先完成实名认证</p>
          <button
            onClick={() => navigate('/verification')}
            className="px-8 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all"
          >
            去实名认证
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
            纠纷调解
          </h1>
          <p className="text-gray-500 mt-1">平台提供专业调解，和平解决合租纠纷</p>
        </div>
        <button
          onClick={() => navigate('/disputes/create')}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all flex items-center space-x-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>发起纠纷</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索纠纷..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待处理' },
              { value: 'mediating', label: '调解中' },
              { value: 'resolved', label: '已解决' },
              { value: 'closed', label: '已关闭' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === opt.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : filteredDisputes.length > 0 ? (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const otherParty = dispute.applicantId === user.id ? dispute.respondent : dispute.applicant;
              const isApplicant = dispute.applicantId === user.id;

              return (
                <div
                  key={dispute.id}
                  className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      dispute.status === 'resolved' ? 'bg-gradient-to-br from-green-100 to-green-200' :
                      dispute.status === 'pending' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200' :
                      dispute.status === 'mediating' ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
                      'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <AlertTriangle className={`w-7 h-7 ${
                        dispute.status === 'resolved' ? 'text-green-500' :
                        dispute.status === 'pending' ? 'text-yellow-500' :
                        dispute.status === 'mediating' ? 'text-blue-500' :
                        'text-gray-500'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {disputeTypeLabels[dispute.type] || dispute.type}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getDisputeStatusColor(dispute.status)}`}>
                          {getStatusIcon(dispute.status)}
                          <span>{formatDisputeStatus(dispute.status)}</span>
                        </span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                          {isApplicant ? '申请人' : '被申请人'}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 space-y-1">
                        <p>
                          <span className="text-gray-400">房源：</span>
                          {dispute.house?.title || '未知房源'}
                        </p>
                        <p>
                          <span className="text-gray-400">对方：</span>
                          {otherParty?.nickname || '未知用户'}
                        </p>
                        <p>
                          <span className="text-gray-400">发起时间：</span>
                          {formatDate(dispute.createdAt)}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/disputes/${dispute.id}`}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center space-x-2 flex-shrink-0"
                    >
                      <span>查看详情</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-orange-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchKeyword || filter !== 'all' ? '没有找到相关纠纷' : '暂无纠纷'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchKeyword || filter !== 'all'
                ? '试试其他搜索条件'
                : '希望你和合租室友相处愉快，有任何问题可以通过平台调解'
              }
            </p>
            {!searchKeyword && filter === 'all' && (
              <button
                onClick={() => navigate('/disputes/create')}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center mx-auto space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>发起纠纷调解</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
