import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Users, AlertCircle, Search, 
  CheckCircle, MoreVertical
} from 'lucide-react';
import { chatApi } from '../api/client.js';
import type { ChatSession } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDateTime, getScoreColor } from '../utils/match.js';

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }

    fetchSessions();
  }, [user, navigate]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await chatApi.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.otherUser.nickname.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  if (!user?.realNameVerified) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">需要实名认证</h2>
          <p className="text-gray-500 mb-8">为了保护用户隐私和安全，聊天功能需要实名认证后才能使用</p>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-orange-500" />
            消息
          </h1>
          <button
            onClick={fetchSessions}
            className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
          >
            刷新
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索聊天..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-gray-50 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <Link
                key={session.chatId}
                to={`/chat/${session.otherUser.id}`}
                className="flex items-center p-4 rounded-2xl hover:bg-gray-50 transition-all group"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={session.otherUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={session.otherUser.nickname}
                    className="w-14 h-14 rounded-2xl border-2 border-gray-100 group-hover:border-orange-200 transition-colors"
                  />
                  {session.otherUser.realNameVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {session.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {session.unreadCount > 99 ? '99+' : session.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 ml-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {session.otherUser.nickname}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatDateTime(session.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${
                      session.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'
                    }`}>
                      {session.lastMessage.content}
                    </p>
                    {session.matchScore !== undefined && (
                      <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${getScoreColor(session.matchScore)}`}>
                        {session.matchScore}分
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-orange-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchKeyword ? '没有找到相关聊天' : '暂无消息'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchKeyword 
                ? '试试其他关键词' 
                : '去看看匹配推荐，找到你的理想室友开始聊天吧'
              }
            </p>
            {!searchKeyword && (
              <button
                onClick={() => navigate('/matches')}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center mx-auto space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>查看匹配推荐</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
