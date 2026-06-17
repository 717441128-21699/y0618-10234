import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Home, Users, CheckCircle, XCircle, ArrowLeft, 
  MessageSquare, FileText, Shield, ChevronLeft, ChevronRight,
  BedDouble, Bath, Maximize, Sun, Building, RefreshCw, Sparkles, BarChart3,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon
} from 'lucide-react';
import MatchScore from '../components/MatchScore.js';
import { houseApi, matchApi, chatApi } from '../api/client.js';
import type { House, Match } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useMatchStore } from '../store/useMatchStore.js';
import { formatTime, formatSmoking, formatGenderPreference, formatDate } from '../utils/match.js';

export default function HouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuthStore();
  const { matches, updateMatch } = useMatchStore();
  const [house, setHouse] = useState<House | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [calculating, setCalculating] = useState(false);

  const houseIdInt = id ? parseInt(id) : NaN;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const houseData = await houseApi.getDetail(parseInt(id));
        setHouse(houseData);

        if (user?.realNameVerified) {
          try {
            const existing = matches.find(m => m.houseId === parseInt(id));
            if (existing && existing.reasons && existing.reasons.length > 0) {
              setMatch(existing);
            }
            await fetchProfile();
            const matchData = await matchApi.calculate(parseInt(id));
            setMatch(matchData);
            updateMatch(matchData, true);
          } catch (e) {
            console.log('Match calculation not available');
          }
        }
      } catch (error) {
        console.error('Failed to fetch house detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, houseIdInt]);

  const handleChat = async () => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }
    if (!house) return;
    
    try {
      await chatApi.sendMessage({
        receiverId: house.landlordId,
        content: `你好，我对「${house.title}」很感兴趣，想了解更多信息。`,
        type: 'text'
      });
      navigate(`/chat/${house.landlordId}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleCreateAgreement = () => {
    if (!house) return;
    navigate(`/agreements/create?houseId=${house.id}&partyBId=${house.landlordId}`);
  };

  const handleRecalculate = async () => {
    if (!id || !user?.realNameVerified) return;
    setCalculating(true);
    try {
      await fetchProfile();
      const freshMatch = await matchApi.calculate(parseInt(id));
      setMatch(freshMatch);
      updateMatch(freshMatch, true);
    } catch (error) {
      console.error('Recalculate failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
            <div className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
          </div>
          <div className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
        </div>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">房源不存在或已被删除</p>
        <button
          onClick={() => navigate('/houses')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
        >
          返回列表
        </button>
      </div>
    );
  }

  const photos = house.photos?.length > 0 ? house.photos : [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20apartment%20interior&image_size=square_hd'
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </button>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="relative h-96">
          <img
            src={photos[currentPhoto]}
            alt={house.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhoto(p => p > 0 ? p - 1 : photos.length - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setCurrentPhoto(p => p < photos.length - 1 ? p + 1 : 0)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {house.isRecruitment && (
                <span className="px-3 py-1.5 bg-teal-500 text-white text-sm font-medium rounded-full flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>补位招募</span>
                </span>
              )}
              {house.landlord?.realNameVerified && (
                <span className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>已认证</span>
                </span>
              )}
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold">
                ¥{house.rent.toLocaleString()}
                <span className="text-lg font-normal">/月</span>
              </div>
            </div>
          </div>

          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentPhoto ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {photos.length > 1 && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    i === currentPhoto ? 'border-orange-500' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{house.title}</h1>
            
            <div className="flex items-center text-gray-500 mb-6">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              <span>{house.location}</span>
              <span className="mx-2">·</span>
              <span>{house.district}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Home className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-sm text-gray-500">房型</div>
                <div className="font-semibold text-gray-800">{house.roomType}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Maximize className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-sm text-gray-500">面积</div>
                <div className="font-semibold text-gray-800">{house.area}㎡</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Sun className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-sm text-gray-500">朝向</div>
                <div className="font-semibold text-gray-800">{house.orientation}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Building className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-sm text-gray-500">楼层</div>
                <div className="font-semibold text-gray-800">{house.floor}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-sm text-gray-500">入住</div>
                <div className="font-semibold text-gray-800">{house.currentOccupants}/{house.maxOccupants}人</div>
              </div>
            </div>
          </div>

          {user?.realNameVerified && (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-orange-50 rounded-2xl p-6 shadow-sm border border-indigo-100">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-200">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                        <span>智能匹配度分析</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </h2>
                      {match?.scoreChange && match.scoreChange.delta !== 0 && (
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          match.scoreChange.delta > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {match.scoreChange.delta > 0 
                            ? <TrendingUpIcon className="w-3 h-3" /> 
                            : <TrendingDownIcon className="w-3 h-3" />}
                          <span>本次{match.scoreChange.delta > 0 ? '上升' : '下降'} {Math.abs(match.scoreChange.delta)} 分</span>
                          <span className="opacity-60 font-normal">
                            （{match.scoreChange.previousOverall}→{match.scoreChange.currentOverall}）
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">6 个维度加权算法 · 与推荐列表同步</p>
                  </div>
                </div>
                <button
                  onClick={handleRecalculate}
                  disabled={calculating}
                  className="group inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="text-sm font-medium">{calculating ? '重新计算中…' : '重新计算'}</span>
                </button>
              </div>

              {match?.scoreChange && match.scoreChange.delta !== 0 && (
                <div className={`mb-4 p-3 rounded-xl border text-sm ${
                  match.scoreChange.delta > 0
                    ? 'bg-emerald-50 border-emerald-100 text-gray-700'
                    : 'bg-rose-50 border-rose-100 text-gray-700'
                }`}>
                  <div className="font-semibold mb-1">
                    {match.scoreChange.delta > 0 ? '📈 这次比上次计算更匹配了！' : '📉 这次比上次计算有所下降'}
                  </div>
                  <div className="text-xs opacity-90">
                    主要变化维度：
                    {[...match.scoreChange.dimensionDeltas]
                      .filter(d => Math.abs(d.weightedChange) >= 0.3)
                      .sort((a, b) => Math.abs(b.weightedChange) - Math.abs(a.weightedChange))
                      .slice(0, 3)
                      .map(d => `${d.label}（${d.before}→${d.after}，加权${d.weightedChange >= 0 ? '+' : ''}${d.weightedChange}分）`)
                      .join('；') || '各维度变化不大'}
                  </div>
                </div>
              )}

              {match ? (
                <MatchScore match={match} />
              ) : (
                <div className="text-center py-10 bg-white/60 rounded-xl border border-dashed border-indigo-200">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center">
                    <RefreshCw className={`w-7 h-7 text-indigo-500 ${calculating ? 'animate-spin' : ''}`} />
                  </div>
                  <p className="text-gray-500 mb-3">
                    {calculating ? '正在根据您的档案计算匹配度…' : '点击右上角按钮计算匹配度'}
                  </p>
                  {!calculating && (
                    <button
                      onClick={handleRecalculate}
                      className="px-5 py-2 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-colors"
                    >
                      立即计算
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">房源描述</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{house.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">公共设施</h2>
            <div className="flex flex-wrap gap-3">
              {house.facilities?.length > 0 ? (
                house.facilities.map((facility, i) => (
                  <span key={i} className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-sm">
                    {facility}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">暂无设施信息</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">对室友的期望</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600">作息时间</span>
                <span className="font-medium text-gray-800">
                  {formatTime(house.expectedSleepTime)} - {formatTime(house.expectedWakeTime)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600">宠物偏好</span>
                <span className={`font-medium flex items-center ${house.allowPet ? 'text-green-600' : 'text-red-500'}`}>
                  {house.allowPet ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                  {house.allowPet ? '允许养宠' : '禁止养宠'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600">吸烟偏好</span>
                <span className={`font-medium flex items-center ${house.allowSmoking ? 'text-green-600' : 'text-red-500'}`}>
                  {house.allowSmoking ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                  {house.allowSmoking ? '允许吸烟' : '禁止吸烟'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600">性别偏好</span>
                <span className="font-medium text-gray-800">{formatGenderPreference(house.genderPreference)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-4">房东信息</h3>
            
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={house.landlord?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt="landlord"
                className="w-16 h-16 rounded-2xl border-2 border-orange-200"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{house.landlord?.nickname}</div>
                {house.landlord?.realNameVerified ? (
                  <div className="flex items-center text-blue-500 text-sm mt-1">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    已实名认证
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600 text-sm mt-1">
                    <Shield className="w-4 h-4 mr-1" />
                    未认证
                  </div>
                )}
              </div>
            </div>

            {house.landlord && (
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">作息</span>
                  <span className="text-gray-700">{formatTime(house.landlord.sleepTime)} - {formatTime(house.landlord.wakeTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">吸烟</span>
                  <span className="text-gray-700">{formatSmoking(house.landlord.smoking)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">宠物</span>
                  <span className={`${house.landlord.hasPet ? 'text-green-600' : 'text-gray-700'}`}>
                    {house.landlord.hasPet ? `有 (${house.landlord.petType})` : '没有'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {user?.id !== house.landlordId && (
                <>
                  <button
                    onClick={handleChat}
                    disabled={calculating}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all flex items-center justify-center space-x-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>发起聊天</span>
                  </button>
                  {user?.realNameVerified && (
                    <button
                      onClick={handleCreateAgreement}
                      className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 transition-all flex items-center justify-center space-x-2"
                    >
                      <FileText className="w-5 h-5" />
                      <span>签订协议</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
              发布于 {formatDate(house.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
