import { Link } from 'react-router-dom';
import { MapPin, Home, Users, CheckCircle, XCircle } from 'lucide-react';
import type { House } from '../../shared/types.js';
import { getMatchLevel, getScoreColor, formatGenderPreference } from '../utils/match.js';

interface HouseCardProps {
  house: House;
  showMatchScore?: boolean;
}

export default function HouseCard({ house, showMatchScore = true }: HouseCardProps) {
  const matchInfo = house.matchScore ? getMatchLevel(house.matchScore) : null;
  const mainPhoto = house.photos?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20apartment%20building&image_size=square';

  return (
    <Link
      to={`/houses/${house.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={mainPhoto}
          alt={house.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {house.isRecruitment && (
            <span className="px-2.5 py-1 bg-teal-500 text-white text-xs font-medium rounded-full flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>补位招募</span>
            </span>
          )}
          {house.landlord?.realNameVerified && (
            <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>已认证</span>
            </span>
          )}
        </div>

        {showMatchScore && house.matchScore !== undefined && matchInfo && (
          <div className="absolute top-3 right-3">
            <div className={`w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg border-2 ${
              house.matchScore >= 80 ? 'border-teal-400' : 
              house.matchScore >= 60 ? 'border-yellow-400' : 'border-red-400'
            }`}>
              <span className={`text-lg font-bold ${getScoreColor(house.matchScore)}`}>
                {house.matchScore}
              </span>
              <span className="text-[10px] text-gray-500">匹配度</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-end justify-between">
            <div className="text-white">
              <div className="text-xl font-bold">
                ¥{house.rent.toLocaleString()}
                <span className="text-sm font-normal opacity-80">/月</span>
              </div>
            </div>
            {matchInfo && showMatchScore && (
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: matchInfo.color }}
              >
                {matchInfo.level}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
          {house.title}
        </h3>
        
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{house.location}</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs text-gray-600 mb-3">
          <span className="px-2 py-1 bg-gray-50 rounded-lg">
            <Home className="w-3 h-3 inline mr-1" />
            {house.roomType}
          </span>
          <span className="px-2 py-1 bg-gray-50 rounded-lg">
            {house.area}㎡
          </span>
          <span className="px-2 py-1 bg-gray-50 rounded-lg">
            {house.orientation}
          </span>
          <span className="px-2 py-1 bg-gray-50 rounded-lg">
            {house.floor}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <img
              src={house.landlord?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt="landlord"
              className="w-7 h-7 rounded-lg"
            />
            <span className="text-sm text-gray-600">{house.landlord?.nickname}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {house.allowPet ? (
              <span className="flex items-center text-green-600 text-xs">
                <CheckCircle className="w-3.5 h-3.5 mr-0.5" />
                可养宠
              </span>
            ) : (
              <span className="flex items-center text-red-500 text-xs">
                <XCircle className="w-3.5 h-3.5 mr-0.5" />
                禁养宠
              </span>
            )}
            <span className="text-gray-400 text-xs">
              {formatGenderPreference(house.genderPreference)}
            </span>
          </div>
        </div>

        {house.isRecruitment && (
          <div className="mt-3 p-2.5 bg-teal-50 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-teal-700">
                现有 {house.currentOccupants} 人
              </span>
              <span className="text-teal-600 font-medium">
                还需 {house.maxOccupants - house.currentOccupants} 人
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
