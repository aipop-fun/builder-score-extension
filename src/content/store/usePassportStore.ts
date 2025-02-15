import { create } from 'zustand';

interface PassportProfile {
    bio: string;
    display_name: string;
    image_url: string;
    location: string | null;
    name: string;
    tags: string[];
}

interface Passport {
    activity_score: number;
    calculating_score: boolean;
    created_at: string;
    human_checkmark: boolean;
    identity_score: number;
    last_calculated_at: string;
    main_wallet: string;
    onchain: boolean;
    passport_id: number;
    passport_profile: PassportProfile;
    score: number;
    skills_score: number;
    socials_calculated_at: string;
    verified: boolean;
    verified_wallets: string[];
}

interface PassportState {
    passports: Record<string, Passport>;
    loading: Record<string, boolean>;
    error: Record<string, string | null>;
    fetchPassport: (username: string) => Promise<void>;
    getPassport: (username: string) => Passport | null;
    clearPassports: () => void;
}

interface MessageResponse {
    success: boolean;
    data?: {
        passports: Passport[];
    };
    error?: string;
}

export const usePassportStore = create<PassportState>((set, get) => ({
    passports: {},
    loading: {},
    error: {},

    fetchPassport: async (username: string) => {
        try {
            // Set loading state for this username
            set((state) => ({
                loading: { ...state.loading, [username]: true },
                error: { ...state.error, [username]: null }
            }));

            // Usa chrome.runtime.sendMessage para se comunicar com o background script
            const response: MessageResponse = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { type: 'FETCH_PASSPORT', username },
                    (response) => {
                        resolve(response);
                    }
                );
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to fetch passport data');
            }

            const passport = response.data.passports[0];

            if (passport) {
                set((state) => ({
                    passports: { ...state.passports, [username]: passport },
                    loading: { ...state.loading, [username]: false }
                }));
            } else {
                throw new Error('No passport found');
            }
        } catch (err) {
            console.error('Error fetching passport:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
            set((state) => ({
                loading: { ...state.loading, [username]: false },
                error: { ...state.error, [username]: errorMessage }
            }));
        }
    },

    getPassport: (username: string) => {
        return get().passports[username] || null;
    },

    clearPassports: () => {
        set({ passports: {}, loading: {}, error: {} });
    }
}));