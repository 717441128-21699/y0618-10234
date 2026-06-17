import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Shield, FileText, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import HouseCard from '../components/HouseCard.js';
import { houseApi, matchApi } from '../api/client.js';
import type { House } from '../../shared/types.js';
import { useAuthStore } from '../store/useAuthStore.js';

export default function Home() {
  const { user } = useAuthStore();
  const [featuredHouses, setFeaturedHouses] = useState<House[]>([]);
  const [matchedHouses, setMatchedHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [houses, matches] = await Promise.all([
          houseApi.getList({ limit: 6 }),
          user?.realNameVerified ? matchApi.getMyMatches().catch(() => []) : Promise.resolve([])
        ]);
        
        setFeaturedHouses(houses.slice(0, 6));
        
        const matchedHousesData = matches
          .slice(0, 6)
          .map(m => ({
            ...m.house!,
            matchScore: m.overallScore
          }))
          .filter(h => h.id);
        
        setMatchedHouses(matchedHousesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const features = [
    { icon: Users, title: '智能匹配', desc: '六维度算法精准推荐理想室友', color: 'from-orange-400 to-orange-500' },
    { icon: Shield, title: '实名认证', desc: '背景核验确保合租安全可靠', color: 'from-teal-400 to-teal-500' },
    { icon: FileText, title: '电子协议', desc: '在线签订室友协议规范合租', color: 'from-blue-400 to-blue-500' },
    { icon: TrendingUp, title: '纠纷调解', desc: '专业调解保障双方合法权益', color: 'from-purple-400 to-purple-500' },
  ];

  const stats = [
    { value: '50,000+', label: '活跃用户' },
    { value: '12,000+', label: '在租房源' },
    { value: '8,500+', label: '成功匹配' },
    { value: '98%', label: '用户满意度' },
  ];

  return (
    <div className="space-y-16">
      <section className="relative py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500 via-orange-400 to-teal-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                找到你的
                <span className="block text-yellow-200">理想室友</span>
              </h1>
              <p className="text-lg text-orange-100 mb-8 leading-relaxed">
                基于智能匹配算法，结合生活习惯、作息时间、兴趣爱好等多维度数据，
                为你推荐最合适的室友，让合租生活更美好。
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/houses"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-orange-500 font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  <Search className="w-5 h-5" />
                  <span>找房源</span>
                </Link>
                <Link
                  to="/matches"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border-2 border-white/30 hover:bg-white/30 transition-all duration-200"
                >
                  <Users className="w-5 h-5" />
                  <span>智能匹配</span>
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl transform rotate-3" />
                <div className="relative bg-white rounded-3xl p-6 shadow-2xl transform -rotate-2">
                  <img
                    src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20roommates%20in%20modern%20apartment%20living%20room&image_size=square_hd"
                    alt="理想室友"
                    className="w-full h-72 object-cover rounded-2xl"
                  />
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map(i => (
                        <img
                          key={i}
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                          alt="user"
                          className="w-10 h-10 rounded-full border-2 border-white"
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      已有 <span className="font-semibold text-orange-500">50,000+</span> 用户找到理想室友
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-teal-500 bg-clip-text text-transparent mb-2">
              {stat.value}
            </div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">为什么选择我们</h2>
            <p className="text-gray-500">四大核心优势，让合租更安心</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {user?.realNameVerified && matchedHouses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">为你推荐</h2>
              <p className="text-gray-500">基于你的生活习惯智能匹配</p>
            </div>
            <Link
              to="/matches"
              className="inline-flex items-center space-x-1 text-orange-500 font-medium hover:text-orange-600 transition-colors"
            >
              <span>查看全部</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedHouses.map(house => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">热门房源</h2>
            <p className="text-gray-500">精选优质合租房源</p>
          </div>
          <Link
            to="/houses"
            className="inline-flex items-center space-x-1 text-orange-500 font-medium hover:text-orange-600 transition-colors"
          >
            <span>查看全部</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHouses.map(house => (
              <HouseCard key={house.id} house={house} showMatchScore={false} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-12 text-center text-white -mx-4 sm:-mx-6 lg:-mx-8 mx-4 sm:mx-6 lg:mx-8">
        <h2 className="text-3xl font-bold mb-4">准备好找到你的理想室友了吗？</h2>
        <p className="text-teal-100 mb-8 max-w-2xl mx-auto">
          立即完善你的个人档案，让我们为你精准匹配最适合的室友。
          实名认证后即可解锁全部功能。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {!user?.realNameVerified ? (
            <Link
              to="/verification"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-teal-600 font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Shield className="w-5 h-5" />
              <span>去实名认证</span>
            </Link>
          ) : (
            <Link
              to="/publish"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-teal-600 font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <MapPin className="w-5 h-5" />
              <span>发布房源</span>
            </Link>
          )}
          <Link
            to="/profile"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border-2 border-white/30 hover:bg-white/30 transition-all duration-200"
          >
            <Users className="w-5 h-5" />
            <span>完善档案</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
