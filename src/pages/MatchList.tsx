import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, AlertCircle, ArrowRight, 
  RefreshCw, Filter, Sparkles, RotateCcw, Check,
  ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { matchApi } from '../api/client.js';
import type { Match } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getMatchLevel, getScoreColor, formatGender, formatTime, formatSmoking } from '../utils/match.js';
import MatchScore from '../components/MatchScore.jsx';

export default function MatchList() {
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchRecalculating, setBatchRecalculating] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'time'>('score');
  const [minScore, setMinScore] = useState(0);
  const [recalculatingId, setRecalculatingId] = useState<number | null>(null);
  const [justRecalculatedId, setJustRecalculatedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [lastRecalcTime, setLastRecalcTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }
    fetchMatches();
  }, [user, navigate]);

  const fetchMatches = async (showBatchLoading = false) => {
    if (showBatchLoading) {
      setBatchRecalculating(true);
    } else {
      setLoading(true);
    }
    try {
      await fetchProfile();
      const data = await matchApi.getMyMatches();
      setMatches(data);
      setLastRecalcTime(new Date());
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
      setBatchRecalculating(false);
    }
  };

  const recalculateSingle = async (houseId: number) => {
    setRecalculatingId(houseId);
    try {
      await fetchProfile();
      const newMatch = await matchApi.calculate(houseId);
      setMatches(prev => {
        const updated = prev.map(m => 
          m.houseId === houseId 
            ? { ...newMatch, id: newMatch.id || m.id, house: newMatch.house || m.house }
            : m
        );
        return updated.sort((a, b) => {
          if (sortBy === 'score') return b.overallScore - a.overallScore;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
      setJustRecalculatedId(houseId);
      setTimeout(() => setJustRecalculatedId(null), 2500);
    } catch (error) {
      console.error('Failed to recalculate match:', error);
      alert('重新计算匹配度失败，请刷新页面重试');
    } finally {
      setRecalculatingId(null);
    }
  };

  const filteredMatches = useMemo(() => 
    matches
      .filter(m => m.overallScore >= minScore)
      .sort((a, b) => {
        if (sortBy === 'score') return b.overallScore - a.overallScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
  [matches, minScore, sortBy]);

  const getMatchStats = () => {
    const excellent = matches.filter(m => m.overallScore >= 80).length;
    const good = matches.filter(m => m.overallScore >= 60 && m.overallScore < 80).length;
    const average = matches.length > 0 
      ? Math.round(matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length)
      : 0;
    return { excellent, good, average };
  };

  const stats = getMatchStats();
  const habitChangeHappened = user && (user.cleaningFrequency || user.socialPreference);

  if (!user?.realNameVerified) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">需要实名认证</h2>
          <p className="text-gray-500 mb-8">为了确保匹配推荐的准确性和安全性，需要先完成实名认证</p>
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
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-teal-400 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">智能匹配推荐</h1>
                <p className="text-orange-100 text-sm">
                  基于作息/宠物/吸烟/性别/习惯/地段 六维度加权算法
                  {lastRecalcTime && ` · 最近计算 ${lastRecalcTime.toLocaleTimeString('zh-CN')}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchMatches(true)}
              disabled={batchRecalculating || loading}
              className="flex items-center space-x-2 px-5 py-3 bg-white text-orange-500 font-semibold rounded-xl shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {batchRecalculating ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <span>{batchRecalculating ? '批量重算中...' : '⚡ 批量重新计算全部'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.excellent}</div>
              <div className="text-sm text-orange-100">极佳匹配 (≥80)</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.good}</div>
              <div className="text-sm text-orange-100">良好匹配 (60-79)</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.average}</div>
              <div className="text-sm text-orange-100">平均匹配度</div>
            </div>
          </div>

          {habitChangeHappened && (
            <div className="mt-5 flex items-start space-x-3 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-xl flex-shrink-0">💡</div>
              <div className="text-sm">
                <div className="font-semibold mb-1">您的当前生活习惯档案</div>
                <div className="opacity-90 space-y-0.5">
                  <div>🧹 清洁频率：<span className="font-semibold">{user.cleaningFrequency || '未设置'}</span></div>
                  <div>👋 社交偏好：<span className="font-semibold">{user.socialPreference || '未设置'}</span></div>
                  <div className="mt-1 opacity-80 text-xs">修改档案后，点击「⚡ 批量重新计算全部」按最新档案刷新所有房源匹配</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <button
              onClick={() => fetchMatches(true)}
              disabled={loading || batchRecalculating}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${batchRecalculating ? 'animate-spin' : ''}`} />
              <span>刷新推荐</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'time')}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-sm"
              >
                <option value="score">按匹配度排序（从高到低）</option>
                <option value="time">按时间排序</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="text-sm text-gray-500 flex-shrink-0">最低匹配度:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="flex-1 md:w-40 accent-orange-500"
            />
            <span className="text-sm font-medium text-orange-500 w-12 flex-shrink-0">{minScore}分</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : batchRecalculating ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 border-orange-200">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Zap className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">正在按最新档案重新计算所有匹配...</h3>
          <p className="text-gray-500">
            正在计算 {matches.length} 套房源 × 6个维度，请稍候
          </p>
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const matchInfo = getMatchLevel(match.overallScore);
            const house = match.house;
            const landlord = house?.landlord;
            const isRecalculating = recalculatingId === house?.id;
            const justRecalculated = justRecalculatedId === house?.id;
            const isExpanded = expandedId === match.id;
            
            if (!house) return null;

            return (
              <div
                key={match.id}
                className={`bg-white rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  justRecalculated 
                    ? 'border-green-400 ring-2 ring-green-200' 
                    : isExpanded 
                      ? 'border-orange-300 shadow-lg -translate-y-0.5'
                      : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-200">
                        <img
                          src={house.photos?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=200&fit=crop'}
                          alt={house.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-800">{landlord?.nickname || '房东'}</h3>
                          {landlord?.realNameVerified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <Users className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                          <div className="flex items-center flex-wrap gap-x-2">
                            <span>{formatGender(landlord?.gender)}</span>
                            <span>·</span>
                            <span>{formatTime(user?.sleepTime)}-{formatTime(user?.wakeTime)}</span>
                          </div>
                          <div className="flex items-center flex-wrap gap-x-2">
                            <span>{user?.hasPet ? '有宠物' : '无宠物'}</span>
                            <span>·</span>
                            <span>{formatSmoking(user?.smoking || 'never')}</span>
                          </div>
                          <div className="text-orange-500 mt-1 font-medium">
                            ¥{house.rent}/月 · {house.area}㎡
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <Link
                            to={`/houses/${house.id}`}
                            className="text-orange-500 hover:text-orange-600 font-medium hover:underline"
                          >
                            {house.title}
                          </Link>
                          {house.isRecruitment && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                              补位招募
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {justRecalculated && (
                            <span className="flex items-center text-green-500 text-sm font-medium animate-pulse">
                              <Check className="w-4 h-4 mr-1" />
                              已更新
                            </span>
                          )}
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium text-white`}
                            style={{ backgroundColor: matchInfo.color }}
                          >
                            {matchInfo.level}
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(match.overallScore)}`}>
                            {match.overallScore}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { score: match.sleepScore, label: '作息', icon: '🌙' },
                          { score: match.petScore, label: '宠物', icon: '🐾' },
                          { score: match.smokingScore, label: '吸烟', icon: '🚭' },
                          { score: match.genderScore, label: '性别', icon: '👤' },
                          { score: match.habitScore, label: '习惯', icon: '🏠' },
                          { score: match.locationScore, label: '地段', icon: '📍' },
                        ].map((item, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-2 text-center">
                            <div className="text-xs mb-0.5">{item.icon} {item.label}</div>
                            <div className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                              {item.score}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {justRecalculated && match.habitBreakdown && (
                        <div className="mt-3 text-xs bg-green-50 rounded-lg p-3 border border-green-100 text-gray-700">
                          ✅ 已按最新档案重算：
                          <span className="mx-2 font-semibold text-teal-700">
                            清洁分 {match.habitBreakdown.cleaningScore}（{match.habitBreakdown.cleaningLabel}）
                          </span>
                          <span className="mx-1">+</span>
                          <span className="font-semibold text-orange-700">
                            社交分 {match.habitBreakdown.socialScore}（{match.habitBreakdown.socialLabel}）
                          </span>
                          <span className="mx-2">→</span>
                          <span className="font-semibold">习惯维度总分 {match.habitScore}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 flex-shrink-0 w-full md:w-auto">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : match.id)}
                        className="px-4 py-2 text-orange-600 bg-orange-50 font-medium rounded-xl hover:bg-orange-100 transition-all flex items-center justify-center space-x-1 border border-orange-100"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className="text-sm">{isExpanded ? '收起理由' : '看评分理由'}</span>
                      </button>

                      <button
                        onClick={() => recalculateSingle(house.id)}
                        disabled={isRecalculating}
                        className="px-4 py-2 bg-teal-50 text-teal-600 font-medium rounded-xl hover:bg-teal-100 transition-all flex items-center justify-center space-x-1 disabled:opacity-60 disabled:cursor-not-allowed border border-teal-200"
                        title="根据最新个人档案重新计算匹配度"
                      >
                        {isRecalculating ? (
                          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        <span className="text-sm">{isRecalculating ? '计算中' : '单算这条'}</span>
                      </button>

                      {landlord && (
                        <Link
                          to={`/chat/${landlord.id}`}
                          className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center space-x-2"
                        >
                          <Users className="w-4 h-4" />
                          <span>联系房东</span>
                        </Link>
                      )}
                      <Link
                        to={`/houses/${house.id}`}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
                      >
                        <span>查看房源</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white animate-in fade-in slide-in-from-top-2 duration-300">
                    <MatchScore match={match} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {batchRecalculating ? '正在计算匹配...' : minScore > 0 ? '没有符合筛选条件的匹配' : '暂无匹配推荐'}
          </h3>
          <p className="text-gray-500 mb-6">
            {minScore > 0 
              ? '试试降低最低匹配度要求，或者批量重新计算一次'
              : '完善你的生活习惯档案，系统将为你推荐更匹配的室友'
            }
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {minScore > 0 && (
              <button
                onClick={() => setMinScore(0)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                重置筛选
              </button>
            )}
            <button
              onClick={() => fetchMatches(true)}
              className="px-6 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>批量重算全部</span>
            </button>
            <Link
              to="/profile"
              className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              完善档案
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
