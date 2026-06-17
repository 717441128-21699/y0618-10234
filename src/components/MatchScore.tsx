import type { Match } from '../../shared/types.js';
import { getMatchLevel, getScoreColor } from '../utils/match.js';

interface MatchScoreProps {
  match: Match;
  showDetails?: boolean;
}

const dimensions = [
  { key: 'sleepScore', label: '作息匹配', icon: '🌙' },
  { key: 'petScore', label: '宠物偏好', icon: '🐾' },
  { key: 'smokingScore', label: '吸烟习惯', icon: '🚭' },
  { key: 'genderScore', label: '性别偏好', icon: '👤' },
  { key: 'habitScore', label: '生活习惯', icon: '🏠' },
  { key: 'locationScore', label: '地段评分', icon: '📍' },
];

export default function MatchScore({ match, showDetails = true }: MatchScoreProps) {
  const matchInfo = getMatchLevel(match.overallScore);

  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (match.overallScore / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={matchInfo.color}
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor(match.overallScore)}`}>
              {match.overallScore}
            </span>
            <span className="text-xs text-gray-500 mt-1">综合匹配度</span>
          </div>
        </div>

        {showDetails && (
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dimensions.map(dim => {
                const score = match[dim.key as keyof Match] as number;
                return (
                  <div key={dim.key} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 flex items-center">
                        <span className="mr-1">{dim.icon}</span>
                        {dim.label}
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                        {score}分
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${score}%`,
                          backgroundColor: score >= 80 ? '#4ECDC4' : score >= 60 ? '#FFD93D' : '#FF6B6B'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: `${matchInfo.color}15` }}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{match.overallScore >= 80 ? '🎉' : match.overallScore >= 60 ? '👍' : '🤔'}</span>
                <div>
                  <p className="font-semibold" style={{ color: matchInfo.color }}>
                    {matchInfo.level}
                  </p>
                  <p className="text-sm text-gray-600">
                    {match.overallScore >= 80 
                      ? '你们的生活习惯非常契合，是理想的室友人选！'
                      : match.overallScore >= 70
                      ? '大部分习惯相符，经过磨合可以成为好室友。'
                      : match.overallScore >= 60
                      ? '有一些差异，建议深入沟通后再做决定。'
                      : '生活习惯差异较大，需要认真考虑是否合适。'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
