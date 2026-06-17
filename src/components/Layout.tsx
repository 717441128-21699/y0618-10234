import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Search, PlusCircle, Users, MessageSquare, 
  FileText, AlertTriangle, User, LogOut, Shield
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useEffect, useState } from 'react';
import { chatApi } from '../api/client.js';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/houses', label: '找房源', icon: Search },
  { path: '/matches', label: '智能匹配', icon: Users },
  { path: '/chat', label: '消息', icon: MessageSquare },
  { path: '/agreements', label: '协议', icon: FileText },
  { path: '/disputes', label: '纠纷调解', icon: AlertTriangle },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token, fetchProfile } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  useEffect(() => {
    if (user?.realNameVerified) {
      chatApi.getUnreadCount().then(res => setUnreadCount(res.count)).catch(() => {});
      const interval = setInterval(() => {
        chatApi.getUnreadCount().then(res => setUnreadCount(res.count)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-teal-500 bg-clip-text text-transparent">
                室友匹配
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const showBadge = item.path === '/chat' && unreadCount > 0;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              {user && !user.realNameVerified && (
                <Link
                  to="/verification"
                  className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm hover:bg-yellow-100 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>去认证</span>
                </Link>
              )}
              
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 rounded-xl hover:bg-gray-100 transition-colors">
                  <img
                    src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt="avatar"
                    className="w-9 h-9 rounded-xl border-2 border-orange-200"
                  />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.nickname}
                  </span>
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">个人中心</span>
                  </Link>
                  {user && !user.realNameVerified && (
                    <Link
                      to="/verification"
                      className="flex items-center space-x-3 px-4 py-2.5 text-yellow-700 hover:bg-yellow-50 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">实名认证</span>
                    </Link>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">退出登录</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-6 h-0.5 bg-gray-600 mb-1.5" />
                <div className="w-6 h-0.5 bg-gray-600 mb-1.5" />
                <div className="w-6 h-0.5 bg-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      isActive 
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <User className="w-5 h-5" />
                <span>个人中心</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <button
        onClick={() => navigate('/publish')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-full shadow-xl shadow-orange-300 flex items-center justify-center hover:scale-110 transition-transform duration-200 z-40"
      >
        <PlusCircle className="w-7 h-7" />
      </button>
    </div>
  );
}
