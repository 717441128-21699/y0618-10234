import { useState } from 'react';
import type { Match } from '../../shared/types.js';
import { getMatchLevel, getScoreColor } from '../utils/match.js';
import { ChevronDown, ChevronUp, Plus, Minus, BarChart3 } from 'lucide-react';

interface MatchScoreProps {
  match: Match;
  showDetails?: boolean;
  compact?: boolean;
}

const DIMENSIONS = [
  { key: 'sleepScore', label: '作息匹配', icon: '🌙', weight: '20%' },
  { key: 'petScore', label: '宠物偏好', icon: '🐾', weight: '15%' },
  { key: 'smokingScore', label: '吸烟习惯', icon: '🚭', weight: '15%' },
  { key: 'genderScore', label: '性别偏好', icon: '👤', weight: '15%' },
  { key: 'habitScore', label: '生活习惯', icon: '🏠', weight: '20%' },
  { key: 'locationScore', label: '地段评分', icon: '📍', weight: '15%' },
];

export default function MatchScore({ match, showDetails = true, compact = false }: MatchScoreProps) {
  const [showReasons, setShowReasons] = useState(false);
  const matchInfo = getMatchLevel(match.overallScore);

  const radius = compact ? 36 : 50;
  const stroke = compact ? 5 : 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (match.overallScore / 100) * circumference;

  const reasons = match.reasons || [];
  const reasonsByKey = new Map(reasons.map(r => [r.key, r]));
  const hasAllReasons = reasons.length === 6;

  const totalWeighted = Math.round(
    reasons.reduce((sum, r) => sum + r.weightedScore, 0)
  ) || match.overallScore;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${compact ? 'p-4' : 'p-6'}`}>
      <div className={`${compact ? 'flex-col gap-3' : 'flex flex-col md:flex-row items-center gap-8'}`}>
        <div className="relative flex-shrink-0">
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
            <span className={`${compact ? 'text-xl' : 'text-3xl'} font-bold ${getScoreColor(match.overallScore)}`}>
              {match.overallScore}
            </span>
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-0.5`}>综合匹配度</span>
          </div>
        </div>

        {showDetails && (
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DIMENSIONS.map(dim => {
                const score = (match[dim.key as keyof Match] as number) || 0;
                const reason = reasonsByKey.get(dim.key);
                return (
                  <div key={dim.key} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 flex items-center">
                        <span className="mr-1">{dim.icon}</span>
                        <span className="truncate">{dim.label}</span>
                      </span>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {reason && (
                          <span className="text-[10px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded">
                            {dim.weight}
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      </div>
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
                    {reason && (
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-end">
                        加权贡献 <span className="font-semibold ml-1 text-gray-600">+{reason.weightedScore}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {match.habitBreakdown && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-xl px-4 py-3 border border-teal-100">
                  <div className="text-xs text-teal-600 font-medium mb-1">🧹 清洁频率</div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm">{match.habitBreakdown.cleaningLabel}</span>
                    <span className={`font-bold ${getScoreColor(match.habitBreakdown.cleaningScore * 2 || 0)}`}>
                      {match.habitBreakdown.cleaningScore}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl px-4 py-3 border border-orange-100">
                  <div className="text-xs text-orange-600 font-medium mb-1">👋 社交偏好</div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm">{match.habitBreakdown.socialLabel}</span>
                    <span className={`font-bold ${getScoreColor(match.habitBreakdown.socialScore * 2 || 0)}`}>
                      {match.habitBreakdown.socialScore}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {hasAllReasons && (
              <button
                onClick={() => setShowReasons(v => !v)}
                className="mt-4 w-full flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 hover:text-gray-800 hover:from-gray-100 hover:to-gray-200 transition-all text-sm font-medium group"
              >
                <BarChart3 className="w-4 h-4 mr-2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                <span>{showReasons ? '收起匹配理由' : '查看详细匹配理由（加分/扣分说明）'}</span>
                {showReasons ? (
                  <ChevronUp className="w-4 h-4 ml-2 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                )}
              </button>
            )}

            {showReasons && hasAllReasons && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {reasons.map(reason => (
                  <div key={reason.key} className="rounded-xl p-4 bg-gray-50/80">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{reason.icon}</span>
                        <span className="font-semibold text-gray-800">{reason.label}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className={`px-2 py-1 rounded-lg font-bold ${getScoreColor(reason.score)} bg-white shadow-sm`}>
                          {reason.score}/100
                        </span>
                        <span className="text-gray-500">× {Math.round(reason.weight * 100)}%</span>
                        <span className={`px-2.5 py-1 rounded-lg font-bold ${getScoreColor(reason.score + 5)} bg-gradient-to-r from-white to-gray-50`}>
                          = {reason.weightedScore} 分
                        </span>
                      </div>
                    </div>
                    
                    {reason.positives.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {reason.positives.map((p, i) => (
                          <div key={i} className="flex items-start text-sm">
                            <div className="mt-0.5 mr-2 flex-shrink-0 w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                              <Plus className="w-3 h-3" strokeWidth={3} />
                            </div>
                            <span className="text-green-700 leading-snug">{p}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {reason.negatives.length > 0 && (
                      <div className="space-y-1.5">
                        {reason.negatives.map((n, i) => (
                          <div key={i} className="flex items-start text-sm">
                            <div className="mt-0.5 mr-2 flex-shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                              <Minus className="w-3 h-3" strokeWidth={3} />
                            </div>
                            <span className="text-red-600 leading-snug">{n}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {reason.positives.length === 0 && reason.negatives.length === 0 && (
                      <div className="text-xs text-gray-400 italic pl-6">暂无详细说明</div>
                    )}
                  </div>
                ))}

                <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-white to-teal-50 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🏆</span>
                      <span className="font-bold text-gray-800">总分计算</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 font-mono">
                        Σ(维度分 × 权重) =
                      </span>
                      <span className="text-2xl font-bold" style={{ color: matchInfo.color }}>
                        {totalWeighted}
                      </span>
                      <span className="text-sm text-gray-400">/ 100</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">{match.overallScore >= 80 ? '🎉' : match.overallScore >= 60 ? '👍' : '🤔'}</span>
                    <span className="font-semibold mr-2" style={{ color: matchInfo.color }}>
                      {matchInfo.level}：
                    </span>
                    <span>
                      {match.overallScore >= 85
                        ? '各维度几乎全绿，几乎是天造地设的室友！非常推荐联系。'
                        : match.overallScore >= 75
                        ? '大部分习惯高度契合，小差异可以通过沟通磨合。'
                        : match.overallScore >= 65
                        ? '有一定差异，但没有硬伤。建议聊天深入了解后再决定。'
                        : match.overallScore >= 55
                        ? '存在几项明显差异，需要双方都有包容心态才建议考虑。'
                        : '多项硬冲突（宠物/吸烟/作息等），不太推荐。'
                      }
                    </span>
                  </p>
                </div>
              </div>
            )}

            {!hasAllReasons && !showReasons && (
              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: `${matchInfo.color}15` }}>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {match.overallScore >= 80 ? '🎉' : match.overallScore >= 60 ? '👍' : '🤔'}
                  </span>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
