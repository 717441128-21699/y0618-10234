import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Send, CheckCircle, Shield, 
  MoreVertical, FileText, AlertTriangle
} from 'lucide-react';
import { chatApi, authApi, agreementApi } from '../api/client.js';
import type { Message, User } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDateTime, formatGender } from '../utils/match.js';

export default function ChatRoom() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [msgs, other] = await Promise.all([
          chatApi.getMessages(parseInt(userId)),
          authApi.getUser(parseInt(userId))
        ]);
        
        setMessages(msgs);
        setOtherUser(other);
        
        if (msgs.length > 0) {
          await chatApi.markAsRead(parseInt(userId));
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !userId || sending) return;

    setSending(true);
    try {
      const msg = await chatApi.sendMessage({
        receiverId: parseInt(userId),
        content: input.trim(),
        type: 'text'
      });
      
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateAgreement = () => {
    if (!otherUser) return;
    navigate(`/agreements/create?partyBId=${otherUser.id}`);
  };

  const handleCreateDispute = () => {
    if (!otherUser) return;
    navigate(`/disputes/create?respondentId=${otherUser.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            {otherUser && (
              <>
                <div className="relative">
                  <img
                    src={otherUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={otherUser.nickname}
                    className="w-10 h-10 rounded-xl"
                  />
                  {otherUser.realNameVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{otherUser.nickname}</div>
                  <div className="text-xs text-gray-500">
                    {formatGender(otherUser.gender)}
                    {otherUser.realNameVerified && (
                      <span className="ml-2 text-blue-500 flex items-center inline-flex">
                        <Shield className="w-3 h-3 mr-0.5" />
                        已认证
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {user?.realNameVerified && (
              <>
                <button
                  onClick={handleCreateAgreement}
                  className="p-2 hover:bg-orange-50 rounded-xl transition-colors text-orange-500"
                  title="创建协议"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCreateDispute}
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500"
                  title="发起纠纷"
                >
                  <AlertTriangle className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <img
                      src={otherUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt=""
                      className="w-8 h-8 rounded-lg mr-2 flex-shrink-0"
                    />
                  )}
                  <div className={`max-w-[70%] ${isMine ? 'order-first' : ''}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                      {formatDateTime(msg.createdAt)}
                      {isMine && (
                        <span className="ml-2">
                          {msg.isRead ? '已读' : '未读'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-orange-300" />
              </div>
              <p className="text-gray-500 mb-2">开始你们的对话吧</p>
              <p className="text-sm text-gray-400">打个招呼，了解彼此的生活习惯</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

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
              onClick={handleSend}
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
      </div>
    </div>
  );
}
