import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Clock, PawPrint, Cigarette, Users, 
  Edit3, Save, CheckCircle, X, Home, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { houseApi } from '../api/client.js';
import { formatTime, formatSmoking, formatGender, formatGenderPreference } from '../utils/match.js';
import HouseCard from '../components/HouseCard.js';
import type { House } from '../../shared/types.js';
import { useEffect } from 'react';

const timeOptions = Array.from({ length: 24 }, (_, i) => 
  `${i.toString().padStart(2, '0')}:00`
);
const cleaningOptions = ['每天', '每周2-3次', '每周1次', '每月1次'];
const socialOptions = ['喜欢社交', '适度社交', '喜欢独处'];

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [myHouses, setMyHouses] = useState<House[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(true);
  
  const [form, setForm] = useState({
    nickname: user?.nickname || '',
    sleepTime: user?.sleepTime || '23:00',
    wakeTime: user?.wakeTime || '07:00',
    hasPet: user?.hasPet || false,
    petType: user?.petType || '',
    smoking: user?.smoking || 'never' as 'never' | 'occasionally' | 'often',
    genderPreference: user?.genderPreference || 'any' as 'male' | 'female' | 'any',
    cleaningFrequency: user?.cleaningFrequency || '每周2-3次',
    socialPreference: user?.socialPreference || '适度社交',
    gender: user?.gender as 'male' | 'female' | undefined,
  });

  useEffect(() => {
    if (user?.realNameVerified) {
      houseApi.getMyHouses()
        .then(data => setMyHouses(data))
        .catch(() => {})
        .finally(() => setLoadingHouses(false));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setForm({
        nickname: user.nickname,
        sleepTime: user.sleepTime || '23:00',
        wakeTime: user.wakeTime || '07:00',
        hasPet: user.hasPet || false,
        petType: user.petType || '',
        smoking: user.smoking || 'never',
        genderPreference: user.genderPreference || 'any',
        cleaningFrequency: user.cleaningFrequency || '每周2-3次',
        socialPreference: user.socialPreference || '适度社交',
        gender: user.gender,
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile(form);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先登录</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt="avatar"
              className="w-28 h-28 rounded-3xl border-4 border-white/30 shadow-2xl"
            />
            {user.realNameVerified && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{user.nickname}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {user.realNameVerified ? (
                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  <Shield className="w-4 h-4 mr-1" />
                  已实名认证
                </span>
              ) : (
                <button
                  onClick={() => navigate('/verification')}
                  className="inline-flex items-center px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-medium hover:bg-yellow-300 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  去实名认证
                </button>
              )}
              {user.gender && (
                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  <User className="w-4 h-4 mr-1" />
                  {formatGender(user.gender)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              editing 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-white text-orange-500 hover:bg-orange-50'
            }`}
          >
            {editing ? (
              <span className="flex items-center space-x-2">
                <X className="w-4 h-4" />
                <span>取消</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4" />
                <span>编辑资料</span>
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">生活习惯档案</h2>
              {editing && (
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.nickname}
                      onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{user.nickname}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
                  {editing ? (
                    <div className="flex space-x-3">
                      {['male', 'female'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm({ ...form, gender: g as 'male' | 'female' })}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            form.gender === g
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        >
                          {formatGender(g)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formatGender(user.gender)}</div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-orange-500" />
                    休息时间
                  </label>
                  {editing ? (
                    <select
                      value={form.sleepTime}
                      onChange={(e) => setForm({ ...form, sleepTime: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formatTime(user.sleepTime)}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-orange-500" />
                    起床时间
                  </label>
                  {editing ? (
                    <select
                      value={form.wakeTime}
                      onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formatTime(user.wakeTime)}</div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PawPrint className="w-4 h-4 inline mr-1 text-orange-500" />
                    宠物情况
                  </label>
                  {editing ? (
                    <div className="space-y-2">
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, hasPet: true })}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                            form.hasPet
                              ? 'border-teal-400 bg-teal-50 text-teal-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        >
                          有宠物
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, hasPet: false, petType: '' })}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                            !form.hasPet
                              ? 'border-teal-400 bg-teal-50 text-teal-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        >
                          没有宠物
                        </button>
                      </div>
                      {form.hasPet && (
                        <input
                          type="text"
                          value={form.petType}
                          onChange={(e) => setForm({ ...form, petType: e.target.value })}
                          placeholder="宠物类型，如：猫、狗"
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">
                      {user.hasPet ? `有 (${user.petType || '宠物'})` : '没有宠物'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Cigarette className="w-4 h-4 inline mr-1 text-orange-500" />
                    吸烟习惯
                  </label>
                  {editing ? (
                    <select
                      value={form.smoking}
                      onChange={(e) => setForm({ ...form, smoking: e.target.value as 'never' | 'occasionally' | 'often' })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    >
                      <option value="never">不吸烟</option>
                      <option value="occasionally">偶尔吸烟</option>
                      <option value="often">经常吸烟</option>
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formatSmoking(user.smoking)}</div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1 text-orange-500" />
                    性别偏好
                  </label>
                  {editing ? (
                    <select
                      value={form.genderPreference}
                      onChange={(e) => setForm({ ...form, genderPreference: e.target.value as 'male' | 'female' | 'any' })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    >
                      <option value="any">性别不限</option>
                      <option value="male">仅限男性</option>
                      <option value="female">仅限女性</option>
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{formatGenderPreference(user.genderPreference || 'any')}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    清洁频率
                  </label>
                  {editing ? (
                    <select
                      value={form.cleaningFrequency}
                      onChange={(e) => setForm({ ...form, cleaningFrequency: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    >
                      {cleaningOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{user.cleaningFrequency || '未设置'}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  社交偏好
                </label>
                {editing ? (
                  <div className="flex space-x-3">
                    {socialOptions.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, socialPreference: opt })}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                          form.socialPreference === opt
                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{user.socialPreference || '未设置'}</div>
                )}
              </div>
            </div>
          </div>

          {user.realNameVerified && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Home className="w-5 h-5 mr-2 text-orange-500" />
                我发布的房源
              </h2>
              
              {loadingHouses ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-gray-50 rounded-2xl h-48 animate-pulse" />
                  ))}
                </div>
              ) : myHouses.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {myHouses.map(house => (
                    <HouseCard key={house.id} house={house} showMatchScore={false} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">你还没有发布房源</p>
                  <button
                    onClick={() => navigate('/publish')}
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    发布房源
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">账号安全</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">实名认证</span>
                </div>
                {user.realNameVerified ? (
                  <span className="text-green-600 text-sm font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    已认证
                  </span>
                ) : (
                  <button
                    onClick={() => navigate('/verification')}
                    className="text-orange-500 text-sm font-medium hover:text-orange-600"
                  >
                    去认证
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">手机号</span>
                </div>
                <span className="text-gray-500 text-sm">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
            <h3 className="font-bold text-teal-800 mb-3">完善档案提示</h3>
            <p className="text-sm text-teal-700 mb-4">
              完善你的生活习惯档案，可以获得更精准的室友匹配推荐，提高匹配成功率。
            </p>
            <div className="space-y-2">
              {[
                { done: !!user.sleepTime, text: '设置作息时间' },
                { done: !!user.smoking, text: '填写吸烟习惯' },
                { done: user.genderPreference !== undefined, text: '设置性别偏好' },
                { done: !!user.cleaningFrequency, text: '设置清洁频率' },
                { done: !!user.socialPreference, text: '设置社交偏好' },
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-2 text-sm">
                  {item.done ? (
                    <CheckCircle className="w-4 h-4 text-teal-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-teal-300" />
                  )}
                  <span className={item.done ? 'text-teal-700' : 'text-teal-600'}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
