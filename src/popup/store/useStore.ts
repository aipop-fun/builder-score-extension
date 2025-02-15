import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

export interface PassportProfile {
    bio: string;
    display_name: string;
    image_url: string;
    name: string;
    tags: string[];
}

export interface Passport {
    passport_id: number;
    activity_score: number;
    identity_score: number;
    skills_score: number;
    score: number;
    verified: boolean;
    human_checkmark: boolean;
    passport_profile: PassportProfile;
    socials: Array<{
        source: string;
        profile_url: string;
    }>;
}

export interface PassportData {
    passport: Passport;
}

interface BuilderStore {
    passportCache: Record<string, PassportData>;
    setPassportData: (username: string, data: PassportData) => void;
    getPassportData: (username: string) => PassportData | null;
    clearCache: () => void;
    fetchPassportFromSupabase: (username: string) => Promise<PassportData | null>;
    syncSupabaseProfile: (passportId: number, newUsername: string) => Promise<void>;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const useStore = create<BuilderStore>()(
    persist(
        (set, get) => ({
            passportCache: {},
            supabase,
            setPassportData: (username: string, data: PassportData) =>
                set((state) => ({
                    passportCache: {
                        ...state.passportCache,
                        [username.toLowerCase()]: data
                    },
                })),

            getPassportData: (username: string) => {
                const cleanUsername = username.toLowerCase().replace(/^@/, '');
                return get().passportCache[cleanUsername] || null;
            },

            clearCache: () => set({ passportCache: {} }),

            fetchPassportFromSupabase: async (username: string) => {
                try {
                    const cleanUsername = username.toLowerCase().replace(/^@/, '');

                    const { data, error } = await supabase
                        .from('passports')
                        .select('*')
                        .filter('socials', 'cs', { source: 'twitter' })
                        .or(`profile_url.ilike.%${cleanUsername}`)
                        .single();

                    if (error || !data) {
                        console.error('Error fetching passport:', error);
                        return null;
                    }

                    // Transform data to match PassportData interface
                    const passportData: PassportData = {
                        passport: {
                            passport_id: data.passport_id,
                            activity_score: data.activity_score,
                            identity_score: data.identity_score,
                            skills_score: data.skills_score,
                            score: data.score,
                            verified: data.verified,
                            human_checkmark: data.human_checkmark,
                            passport_profile: {
                                bio: data.bio,
                                display_name: data.display_name,
                                image_url: data.image_url,
                                name: data.profile_name,
                                tags: data.tags || []
                            },
                            socials: data.socials
                        }
                    };

                    // Update cache
                    get().setPassportData(cleanUsername, passportData);
                    return passportData;

                } catch (error) {
                    console.error('Error in fetchPassportFromSupabase:', error);
                    return null;
                }
            },

            syncSupabaseProfile: async (passportId: number, newUsername: string) => {
                try {
                    const cleanUsername = newUsername.toLowerCase().replace(/^@/, '');

                    // Update socials in Supabase
                    const { error: updateError } = await supabase
                        .from('passports')
                        .update({
                            socials: [{
                                source: 'twitter',
                                profile_url: `https://x.com/${cleanUsername}`
                            }]
                        })
                        .eq('passport_id', passportId);

                    if (updateError) {
                        console.error('Error updating passport:', updateError);
                        return;
                    }

                    // Fetch updated data
                    const updatedPassport = await get().fetchPassportFromSupabase(cleanUsername);
                    if (updatedPassport) {
                        get().setPassportData(cleanUsername, updatedPassport);
                    }

                } catch (error) {
                    console.error('Error in syncSupabaseProfile:', error);
                }
            }
        }),
        {
            name: 'talent-protocol-cache',
            version: 2, 
            partialize: (state) => ({
                passportCache: state.passportCache
            })
        }
    )
);