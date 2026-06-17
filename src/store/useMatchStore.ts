import { create } from 'zustand';
import type { Match, DimensionDelta, ScoreChange } from '../../shared/types.js';
import { matchApi } from '../api/client.js';
import { useAuthStore } from './useAuthStore.js';

export type DimensionFilterKey =
  | 'all'
  | 'sleep_conflict'
  | 'pet_conflict'
  | 'smoking_conflict'
  | 'cleaning_diff'
  | 'social_diff'
  | 'gender_mismatch'
  | 'location_low';

interface MatchStoreState {
  matches: Match[];
  snapshots: Record<number, Match>;
  expandedIds: Set<number>;
  sortBy: 'score' | 'time';
  minScore: number;
  dimensionFilter: DimensionFilterKey;
  loading: boolean;
  batchRecalculating: boolean;
  lastRecalcTime: Date | null;
  justRecalculatedId: number | null;

  fetchMatches: (showBatchLoading?: boolean) => Promise<void>;
  recalculateSingle: (houseId: number) => Promise<void>;
  updateMatch: (match: Match, computeChange?: boolean) => void;
  toggleExpand: (matchId: number) => void;
  setSortBy: (s: 'score' | 'time') => void;
  setMinScore: (n: number) => void;
  setDimensionFilter: (k: DimensionFilterKey) => void;
  setJustRecalculatedId: (id: number | null) => void;
  clearAllExpanded: () => void;
}

const DIM_WEIGHTS: Record<string, number> = {
  sleep: 0.20, pet: 0.15, smoking: 0.15,
  gender: 0.15, habit: 0.20, location: 0.15,
};

const DIM_LABELS: Record<string, string> = {
  sleep: '作息', pet: '宠物', smoking: '吸烟',
  gender: '性别', habit: '习惯', location: '地段',
};

function extractDimScore(m: Match, key: string): number {
  switch (key) {
    case 'sleep': return m.sleepScore;
    case 'pet': return m.petScore;
    case 'smoking': return m.smokingScore;
    case 'gender': return m.genderScore;
    case 'habit': return m.habitScore;
    case 'location': return m.locationScore;
    default: return 0;
  }
}

function computeScoreChange(before: Match, after: Match): ScoreChange {
  const dims = ['sleep', 'pet', 'smoking', 'gender', 'habit', 'location'];
  const dimensionDeltas: DimensionDelta[] = dims.map(key => {
    const b = extractDimScore(before, key);
    const a = extractDimScore(after, key);
    const change = a - b;
    const weight = DIM_WEIGHTS[key];
    return {
      key,
      label: DIM_LABELS[key],
      before: b,
      after: a,
      change,
      weight,
      weightedChange: +(change * weight).toFixed(1),
    };
  });
  return {
    previousOverall: before.overallScore,
    currentOverall: after.overallScore,
    delta: +(after.overallScore - before.overallScore).toFixed(1),
    timestamp: new Date(),
    dimensionDeltas,
  };
}

export const useMatchStore = create<MatchStoreState>((set, get) => ({
  matches: [],
  snapshots: {},
  expandedIds: new Set(),
  sortBy: 'score',
  minScore: 0,
  dimensionFilter: 'all',
  loading: false,
  batchRecalculating: false,
  lastRecalcTime: null,
  justRecalculatedId: null,

  fetchMatches: async (showBatchLoading = false) => {
    if (showBatchLoading) {
      set({ batchRecalculating: true });
    } else {
      set({ loading: true });
    }
    try {
      const { fetchProfile } = useAuthStore.getState();
      await fetchProfile();
      const prevMatches = get().matches;
      const snapMap: Record<number, Match> = {};
      prevMatches.forEach(m => { if (m.houseId) snapMap[m.houseId] = m; });

      const data = await matchApi.getMyMatches();

      const final = data.map(m => {
        const snap = snapMap[m.houseId];
        if (snap) {
          return { ...m, scoreChange: computeScoreChange(snap, m) };
        }
        return m;
      });

      const newSnaps: Record<number, Match> = {};
      final.forEach(m => { if (m.houseId) newSnaps[m.houseId] = m; });

      set({
        matches: final,
        snapshots: newSnaps,
        lastRecalcTime: new Date(),
      });
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      throw error;
    } finally {
      set({ loading: false, batchRecalculating: false });
    }
  },

  recalculateSingle: async (houseId: number) => {
    try {
      const { fetchProfile } = useAuthStore.getState();
      await fetchProfile();

      const before = get().matches.find(m => m.houseId === houseId) || get().snapshots[houseId];
      const newMatch = await matchApi.calculate(houseId);
      const sc = before ? computeScoreChange(before, newMatch) : null;

      set(state => {
        const updatedMatch: Match = {
          ...newMatch,
          id: newMatch.id || before?.id || 0,
          house: newMatch.house || before?.house,
          scoreChange: sc,
        };
        const idx = state.matches.findIndex(m => m.houseId === houseId);
        let newMatches: Match[];
        if (idx >= 0) {
          newMatches = [...state.matches];
          newMatches[idx] = updatedMatch;
        } else {
          newMatches = [...state.matches, updatedMatch];
        }
        const newSnaps = { ...state.snapshots, [houseId]: updatedMatch };
        return {
          matches: newMatches,
          snapshots: newSnaps,
          justRecalculatedId: houseId,
        };
      });

      setTimeout(() => set({ justRecalculatedId: null }), 3000);
    } catch (error) {
      console.error('Failed to recalculate match:', error);
      throw error;
    }
  },

  updateMatch: (match: Match, computeChange = true) => {
    set(state => {
      const before = state.matches.find(m => m.houseId === match.houseId) || state.snapshots[match.houseId];
      const sc = before && computeChange ? computeScoreChange(before, match) : match.scoreChange || null;
      const updated: Match = { ...match, scoreChange: sc };

      const idx = state.matches.findIndex(m => m.houseId === match.houseId);
      let newMatches: Match[];
      if (idx >= 0) {
        newMatches = [...state.matches];
        newMatches[idx] = updated;
      } else {
        newMatches = [...state.matches, updated];
      }
      const newSnaps = { ...state.snapshots, [match.houseId]: updated };
      return { matches: newMatches, snapshots: newSnaps };
    });
  },

  toggleExpand: (matchId: number) => {
    set(state => {
      const next = new Set(state.expandedIds);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return { expandedIds: next };
    });
  },

  setSortBy: (s) => set({ sortBy: s }),
  setMinScore: (n) => set({ minScore: n }),
  setDimensionFilter: (k) => set({ dimensionFilter: k }),
  setJustRecalculatedId: (id) => set({ justRecalculatedId: id }),
  clearAllExpanded: () => set({ expandedIds: new Set() }),
}));

export function applyDimensionFilter(matches: Match[], filter: DimensionFilterKey): Match[] {
  if (filter === 'all') return matches;
  return matches.filter(m => {
    const r = m.reasons || [];
    const byKey = (key: string) => r.find(x => x.key === key);
    const hasNeg = (key: string, minScore = 70) => {
      const d = byKey(key);
      if (!d) return false;
      if (d.negatives && d.negatives.length > 0) return true;
      return d.score < minScore;
    };
    const hb = m.habitBreakdown;
    switch (filter) {
      case 'sleep_conflict': return hasNeg('sleep', 70);
      case 'pet_conflict': return hasNeg('pet', 70);
      case 'smoking_conflict': return hasNeg('smoking', 70);
      case 'gender_mismatch': return hasNeg('gender', 80);
      case 'location_low': return hasNeg('location', 85);
      case 'cleaning_diff':
        if (hb) return hb.cleaningScore <= 35;
        return hasNeg('habit', 60);
      case 'social_diff':
        if (hb) return hb.socialScore <= 28;
        return hasNeg('habit', 60);
      default: return true;
    }
  });
}
