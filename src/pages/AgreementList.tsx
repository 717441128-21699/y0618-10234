import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, PlusCircle, AlertCircle, Search,
  CheckCircle, Clock, XCircle, ArrowRight
} from 'lucide-react';
import { agreementApi } from '../api/client.js';
import type { Agreement } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatAgreementStatus, getAgreementStatusColor, formatDate } from '../utils/match.js';

export default function AgreementList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'signed' | 'terminated'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }

    fetchAgreements();
  }, [user, navigate]);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const data = await agreementApi.getList();
      setAgreements(data);
    } catch (error) {
      console.error('Failed to fetch agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgreements = agreements.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        a.house?.title.toLowerCase().includes(keyword) ||
        a.partyA?.nickname.toLowerCase().includes(keyword) ||
        a.partyB?.nickname.toLowerCase().includes(keyword)
      );
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'terminated': return <XCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
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
          <p className="text-gray-500 mb-8">协议功能需要实名认证后才能使用，请先完成实名认证</p>
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
            <FileText className="w-6 h-6 mr-2 text-orange-500" />
            室友协议
          </h1>
          <p className="text-gray-500 mt-1">管理你的合租协议，规范合租生活</p>
        </div>
        <button
          onClick={() => navigate('/agreements/create')}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all flex items-center space-x-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>创建协议</span>
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
              placeholder="搜索协议..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待签署' },
              { value: 'signed', label: '已签署' },
              { value: 'terminated', label: '已终止' },
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
        ) : filteredAgreements.length > 0 ? (
          <div className="space-y-4">
            {filteredAgreements.map((agreement) => {
              const otherParty = agreement.partyAId === user.id ? agreement.partyB : agreement.partyA;
              const isPartyA = agreement.partyAId === user.id;
              const needMySignature = (
                agreement.status === 'pending' &&
                ((isPartyA && !agreement.signatureA) || (!isPartyA && !agreement.signatureB))
              );

              return (
                <div
                  key={agreement.id}
                  className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-7 h-7 text-orange-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {agreement.house?.title || '室友协议'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getAgreementStatusColor(agreement.status)}`}>
                          {getStatusIcon(agreement.status)}
                          <span>{formatAgreementStatus(agreement.status)}</span>
                        </span>
                        {needMySignature && (
                          <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                            待我签署
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-500 space-y-1">
                        <p>
                          <span className="text-gray-400">双方：</span>
                          {agreement.partyA?.nickname} ↔ {agreement.partyB?.nickname}
                        </p>
                        <p>
                          <span className="text-gray-400">租期：</span>
                          {formatDate(agreement.startDate)} 至 {formatDate(agreement.endDate)}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/agreements/${agreement.id}`}
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
              <FileText className="w-10 h-10 text-orange-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchKeyword || filter !== 'all' ? '没有找到相关协议' : '暂无协议'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchKeyword || filter !== 'all'
                ? '试试其他搜索条件'
                : '与室友达成入住意向后，创建一份室友协议规范合租生活'
              }
            </p>
            {!searchKeyword && filter === 'all' && (
              <button
                onClick={() => navigate('/agreements/create')}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center mx-auto space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>创建协议</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
