import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, AlertCircle, ArrowRight, 
  RefreshCw, Filter, Sparkles
} from 'lucide-react';
import { matchApi, authApi } from '../api/client.js';
import type { Match, User } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getMatchLevel, getScoreColor, formatGender, formatTime } from '../utils/match.js';

export default function MatchList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'time'>('score');
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }

    fetchMatches();
  }, [user, navigate]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const data = await matchApi.getMyMatches();
      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches
    .filter(m => m.overallScore >= minScore)
    .sort((a, b) => {
      if (sortBy === 'score') return b.overallScore - a.overallScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getMatchStats = () => {
    const excellent = matches.filter(m => m.overallScore >= 80).length;
    const good = matches.filter(m => m.overallScore >= 60 && m.overallScore < 80).length;
    const average = matches.length > 0 
      ? Math.round(matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length)
      : 0;
    return { excellent, good, average };
  };

  const stats = getMatchStats();

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
        <div className="relative">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">智能匹配推荐</h1>
              <p className="text-orange-100">基于六维度算法为你精准推荐理想室友</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.excellent}</div>
              <div className="text-sm text-orange-100">极佳匹配</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.good}</div>
              <div className="text-sm text-orange-100">良好匹配</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.average}</div>
              <div className="text-sm text-orange-100">平均匹配度</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchMatches}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新推荐</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'time')}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-sm"
              >
                <option value="score">按匹配度排序</option>
                <option value="time">按时间排序</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">最低匹配度:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-32 accent-orange-500"
            />
            <span className="text-sm font-medium text-orange-500 w-12">{minScore}分</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const matchInfo = getMatchLevel(match.overallScore);
            const seeker = match.seeker;
            const house = match.house;
            
            if (!seeker || !house) return null;

            return (
              <div
                key={match.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="relative">
                      <img
                        src={seeker.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={seeker.nickname}
                        className="w-16 h-16 rounded-2xl border-2 border-orange-200"
                      />
                      {seeker.realNameVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Users className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{seeker.nickname}</h3>
                      <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                        <div>{formatGender(seeker.gender)} · {formatTime(seeker.sleepTime)}-{formatTime(seeker.wakeTime)}</div>
                        <div>{seeker.hasPet ? '有宠物' : '无宠物'} · {seeker.smoking === 'never' ? '不吸烟' : '吸烟'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <Link
                        to={`/houses/${house.id}`}
                        className="text-orange-500 hover:text-orange-600 font-medium hover:underline"
                      >
                        {house.title}
                      </Link>
                      <div className="flex items-center space-x-2">
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
                        { score: match.sleepScore, label: '作息' },
                        { score: match.petScore, label: '宠物' },
                        { score: match.smokingScore, label: '吸烟' },
                        { score: match.genderScore, label: '性别' },
                        { score: match.habitScore, label: '习惯' },
                        { score: match.locationScore, label: '地段' },
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-2 text-center">
                          <div className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                            {item.score}
                          </div>
                          <div className="text-xs text-gray-500">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 flex-shrink-0">
                    <Link
                      to={`/chat/${seeker.id}`}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center space-x-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>发起聊天</span>
                    </Link>
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
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {minScore > 0 ? '没有符合筛选条件的匹配' : '暂无匹配推荐'}
          </h3>
          <p className="text-gray-500 mb-6">
            {minScore > 0 
              ? '试试降低最低匹配度要求，或者刷新获取更多推荐'
              : '完善你的生活习惯档案，系统将为你推荐更匹配的室友'
            }
          </p>
          <div className="flex justify-center gap-4">
            {minScore > 0 && (
              <button
                onClick={() => setMinScore(0)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                重置筛选
              </button>
            )}
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
