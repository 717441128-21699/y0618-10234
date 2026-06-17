import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Users, CheckCircle, XCircle, SlidersHorizontal } from 'lucide-react';
import HouseCard from '../components/HouseCard.js';
import Empty from '../components/Empty.js';
import { houseApi, matchApi } from '../api/client.js';
import type { House } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';

const districts = ['全部', '朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区'];
const roomTypes = ['全部', '主卧', '次卧', '单间', '整租'];

export default function HouseList() {
  const { user } = useAuthStore();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [filters, setFilters] = useState({
    district: '全部',
    roomType: '全部',
    minRent: '',
    maxRent: '',
    allowPet: false,
    allowSmoking: false,
    isRecruitment: false,
  });

  const fetchHouses = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.district !== '全部') params.district = filters.district;
      if (filters.roomType !== '全部') params.roomType = filters.roomType;
      if (filters.minRent) params.minRent = parseInt(filters.minRent);
      if (filters.maxRent) params.maxRent = parseInt(filters.maxRent);
      if (filters.allowPet) params.allowPet = true;
      if (filters.allowSmoking) params.allowSmoking = true;
      if (filters.isRecruitment) params.isRecruitment = true;

      let housesData = await houseApi.getList(params);
      
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        housesData = housesData.filter(h => 
          h.title.toLowerCase().includes(keyword) ||
          h.location.toLowerCase().includes(keyword) ||
          h.district.toLowerCase().includes(keyword)
        );
      }

      if (user?.realNameVerified) {
        const matches = await matchApi.getMyMatches().catch(() => []);
        const scoreMap = new Map<number, number>(matches.map(m => [m.houseId, m.overallScore] as const));
        housesData = housesData.map(h => ({
          ...h,
          matchScore: scoreMap.get(h.id) ?? 0
        }));
      }

      setHouses(housesData);
    } catch (error) {
      console.error('Failed to fetch houses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, [filters, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHouses();
  };

  const resetFilters = () => {
    setFilters({
      district: '全部',
      roomType: '全部',
      minRent: '',
      maxRent: '',
      allowPet: false,
      allowSmoking: false,
      isRecruitment: false,
    });
    setSearchKeyword('');
  };

  const activeFilterCount = [
    filters.district !== '全部',
    filters.roomType !== '全部',
    filters.minRent,
    filters.maxRent,
    filters.allowPet,
    filters.allowSmoking,
    filters.isRecruitment,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索小区、地址、标题..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors relative"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">筛选</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="submit"
            className="px-8 py-3.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all"
          >
            搜索
          </button>
        </form>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-6 animate-fadeIn">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">区域</label>
                <select
                  value={filters.district}
                  onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                >
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房型</label>
                <select
                  value={filters.roomType}
                  onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                >
                  {roomTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最低租金</label>
                <input
                  type="number"
                  value={filters.minRent}
                  onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                  placeholder="元/月"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最高租金</label>
                <input
                  type="number"
                  value={filters.maxRent}
                  onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                  placeholder="元/月"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, allowPet: !filters.allowPet })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  filters.allowPet
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                {filters.allowPet ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>允许养宠</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, allowSmoking: !filters.allowSmoking })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  filters.allowSmoking
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                {filters.allowSmoking ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>允许吸烟</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, isRecruitment: !filters.isRecruitment })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  filters.isRecruitment
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>补位招募</span>
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                重置筛选
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-gray-600">
          共找到 <span className="font-semibold text-orange-500">{houses.length}</span> 套房源
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : houses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {houses.map(house => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无符合条件的房源</h3>
          <p className="text-gray-500 mb-6">试试调整筛选条件或搜索关键词</p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            重置筛选条件
          </button>
        </div>
      )}
    </div>
  );
}
