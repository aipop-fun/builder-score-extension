import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PassportData {
  passport_id: string;
  activity_score: number;
  identity_score: number;
  skills_score: number;
  score: number;
  verified: boolean;
  display_name: string;
  bio: string;
  image_url: string;
  main_wallet: string;
}

interface CachedPassportData {
  passport: PassportData;
  timestamp: number;
}

interface StoreState {
  passportCache: Record<string, CachedPassportData>;
  setPassportData: (username: string, data: { passport: PassportData }) => void;
  getPassportData: (username: string) => CachedPassportData | null;
  clearCache: () => void;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      passportCache: {},

      setPassportData: (username: string, data: { passport: PassportData }) => {
        set((state) => ({
          passportCache: {
            ...state.passportCache,
            [username]: {
              passport: data.passport,
              timestamp: Date.now()
            }
          }
        }));
      },

      getPassportData: (username: string) => {
        const cached = get().passportCache[username];
        
        if (!cached) return null;
        
        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_DURATION) {
          return null;
        }
        
        return cached;
      },

      clearCache: () => {
        set({ passportCache: {} });
      }
    }),
    {
      name: 'builder-score-storage',
    }
  )
);