import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, User, CreditCard, CheckCircle2, 
  AlertCircle, ArrowLeft, Lock
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';

export default function VerifyIdentity() {
  const navigate = useNavigate();
  const { verifyIdentity, isLoading, user } = useAuthStore();
  const [idCard, setIdCard] = useState('');
  const [realName, setRealName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!idCard || !realName) {
      setError('请填写完整信息');
      return;
    }

    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    if (!idCardRegex.test(idCard)) {
      setError('请输入正确的身份证号码');
      return;
    }

    if (realName.length < 2) {
      setError('请输入真实姓名');
      return;
    }

    try {
      await verifyIdentity(idCard, realName);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '认证失败，请稍后重试');
    }
  };

  if (user?.realNameVerified && !success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">已完成实名认证</h2>
          <p className="text-gray-500 mb-8">你的账号已完成实名认证，可以使用全部功能</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">实名认证成功！</h2>
          <p className="text-gray-500 mb-8">恭喜你完成实名认证，现在可以使用全部功能了</p>
          <div className="animate-pulse">
            <p className="text-sm text-gray-400">即将跳转...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </button>

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">实名认证</h1>
              <p className="text-blue-100 text-sm">完成认证，解锁全部功能</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-xl font-bold">100%</div>
              <div className="text-xs text-blue-100">信息加密</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-xl font-bold">24h</div>
              <div className="text-xs text-blue-100">快速审核</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-xl font-bold">✓</div>
              <div className="text-xs text-blue-100">平台保障</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 mb-1">为什么需要实名认证？</p>
            <p className="text-yellow-700">
              为了保障平台用户的安全，防止虚假信息和欺诈行为，所有用户在发布房源、
              使用聊天和协议功能前需要完成实名认证。我们承诺严格保护你的个人隐私。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1 text-orange-500" />
              真实姓名
            </label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="请输入你的真实姓名"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1 text-orange-500" />
              身份证号码
            </label>
            <input
              type="text"
              value={idCard}
              onChange={(e) => setIdCard(e.target.value.toUpperCase())}
              placeholder="请输入18位身份证号码"
              maxLength={18}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all font-mono tracking-wider"
            />
          </div>

          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
            <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              你的个人信息将被严格加密存储，仅用于身份核验，不会对外公开或用于其他用途。
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>提交认证</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">认证说明</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>请确保填写的信息与身份证一致，否则将无法通过认证</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>认证信息提交后，系统将自动核验，通常立即完成</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500">•</span>
              <span>每个账号只能绑定一个身份证信息，认证后不可修改</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
