import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Home, DollarSign, Maximize, Sun, Building, Users,
  BedDouble, Clock, PawPrint, Cigarette, UserPlus, CheckCircle,
  Upload, X, ChevronRight, ArrowLeft, AlertCircle
} from 'lucide-react';
import { houseApi } from '../api/client.js';
import { useAuthStore } from '../store/useAuthStore.js';

const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区'];
const roomTypes = ['主卧', '次卧', '单间', '整租'];
const orientations = ['南', '北', '东', '西', '南北通透'];
const floors = ['低层', '中层', '高层'];
const timeOptions = Array.from({ length: 24 }, (_, i) => 
  `${i.toString().padStart(2, '0')}:00`
);
const commonFacilities = [
  '空调', '洗衣机', '冰箱', '热水器', 'WiFi', '厨房', 
  '独立卫浴', '阳台', '暖气', '电梯', '停车位', '健身房'
];

export default function PublishHouse() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    title: '',
    location: '',
    district: districts[0],
    rent: '',
    area: '',
    roomType: roomTypes[0],
    orientation: orientations[0],
    floor: floors[0],
    facilities: [] as string[],
    description: '',
    expectedSleepTime: '23:00',
    expectedWakeTime: '07:00',
    allowPet: false,
    allowSmoking: false,
    genderPreference: 'any' as 'male' | 'female' | 'any',
    maxOccupants: 2,
    currentOccupants: 1,
    isRecruitment: false,
  });

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleFacility = (facility: string) => {
    setForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handlePhotoUpload = () => {
    const prompts = [
      'modern%20bright%20bedroom%20with%20big%20window',
      'cozy%20living%20room%20modern%20apartment',
      'clean%20bathroom%20modern%20design',
      'modern%20kitchen%20with%20appliances'
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const newPhoto = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${randomPrompt}&image_size=square_hd&t=${Date.now()}`;
    setPhotos(prev => [...prev, newPhoto]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!form.title) return '请填写房源标题';
    if (!form.location) return '请填写详细地址';
    if (!form.rent) return '请填写月租金';
    if (!form.area) return '请填写房间面积';
    if (photos.length === 0) return '请至少上传一张房间照片';
    return '';
  };

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!user?.realNameVerified) {
      navigate('/verification');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await houseApi.create({
        ...form,
        rent: parseInt(form.rent),
        area: parseInt(form.area),
        photos,
      });
      
      navigate('/houses');
    } catch (err: any) {
      setError(err.message || '发布失败，请稍后重试');
    } finally {
      setLoading(false);
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
          <p className="text-gray-500 mb-8">为了保障平台用户的安全，发布房源前需要完成实名认证</p>
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
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </button>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">发布房源</h1>
          <p className="text-gray-500">填写房源信息，找到你的理想室友</p>
        </div>

        <div className="flex items-center mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s 
                  ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                  step > s ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">房源标题 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="例如：朝阳区温馨主卧出租，近地铁"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">所在区域 *</label>
                <select
                  value={form.district}
                  onChange={(e) => updateForm('district', e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                >
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详细地址 *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateForm('location', e.target.value)}
                    placeholder="小区名称、门牌号"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">月租金 (元/月) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={form.rent}
                    onChange={(e) => updateForm('rent', e.target.value)}
                    placeholder="3000"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房间面积 (㎡) *</label>
                <div className="relative">
                  <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={form.area}
                    onChange={(e) => updateForm('area', e.target.value)}
                    placeholder="15"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房型 *</label>
                <select
                  value={form.roomType}
                  onChange={(e) => updateForm('roomType', e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                >
                  {roomTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">朝向</label>
                <select
                  value={form.orientation}
                  onChange={(e) => updateForm('orientation', e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                >
                  {orientations.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">楼层</label>
                <select
                  value={form.floor}
                  onChange={(e) => updateForm('floor', e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                >
                  {floors.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">房间照片 *</label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {photos.length < 8 && (
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
                  >
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm">添加照片</span>
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">最多上传8张照片</p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all flex items-center space-x-2"
              >
                <span>下一步</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">公共设施</label>
              <div className="flex flex-wrap gap-3">
                {commonFacilities.map(facility => (
                  <button
                    key={facility}
                    type="button"
                    onClick={() => toggleFacility(facility)}
                    className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center space-x-2 ${
                      form.facilities.includes(facility)
                        ? 'border-teal-400 bg-teal-50 text-teal-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {form.facilities.includes(facility) && <CheckCircle className="w-4 h-4" />}
                    <span>{facility}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">房源描述</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={4}
                placeholder="介绍一下你的房子、周边环境、交通情况等..."
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            <div className="p-4 bg-orange-50 rounded-xl">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <label className="flex items-center space-x-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRecruitment}
                      onChange={(e) => updateForm('isRecruitment', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                    />
                    <span className="font-medium text-gray-800">这是补位招募（原室友搬走需补位）</span>
                  </label>
                  {form.isRecruitment && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">现有人数</label>
                        <input
                          type="number"
                          min="1"
                          value={form.currentOccupants}
                          onChange={(e) => updateForm('currentOccupants', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">总共可住</label>
                        <input
                          type="number"
                          min="1"
                          value={form.maxOccupants}
                          onChange={(e) => updateForm('maxOccupants', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all flex items-center space-x-2"
              >
                <span>下一步</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="p-4 bg-teal-50 rounded-xl mb-6">
              <h3 className="font-semibold text-teal-800 mb-2">对室友的期望</h3>
              <p className="text-sm text-teal-600">设置你的偏好，系统将为你推荐更匹配的室友</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">期望休息时间</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={form.expectedSleepTime}
                    onChange={(e) => updateForm('expectedSleepTime', e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">期望起床时间</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={form.expectedWakeTime}
                    onChange={(e) => updateForm('expectedWakeTime', e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">宠物偏好</label>
                <button
                  type="button"
                  onClick={() => updateForm('allowPet', !form.allowPet)}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 ${
                    form.allowPet
                      ? 'border-teal-400 bg-teal-50 text-teal-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <PawPrint className="w-5 h-5" />
                  <span>{form.allowPet ? '允许养宠物' : '不允许养宠物'}</span>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">吸烟偏好</label>
                <button
                  type="button"
                  onClick={() => updateForm('allowSmoking', !form.allowSmoking)}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 ${
                    form.allowSmoking
                      ? 'border-teal-400 bg-teal-50 text-teal-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <Cigarette className="w-5 h-5" />
                  <span>{form.allowSmoking ? '允许吸烟' : '不允许吸烟'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性别偏好</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'any', label: '不限', icon: Users },
                  { value: 'male', label: '仅限男性', icon: UserPlus },
                  { value: 'female', label: '仅限女性', icon: UserPlus },
                ].map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateForm('genderPreference', opt.value)}
                      className={`px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 ${
                        form.genderPreference === opt.value
                          ? 'border-teal-400 bg-teal-50 text-teal-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>发布房源</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
