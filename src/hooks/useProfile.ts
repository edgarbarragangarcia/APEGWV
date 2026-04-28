import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';

// Define a type for the Profile to avoid 'any'
// Ideally this comes from your generated database types (supabase-js)
export interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    handicap: number | null;
    federation_code: string | null;
    phone: string | null;
    address: string | null;
    has_completed_onboarding: boolean | null;
    is_admin: boolean | null;
    is_premium: boolean | null;
    average_score: number | null;
    best_score: number | null;
    total_rounds: number | null;
}

const PROFILE_CACHE_KEY = 'user-profile-persistence';

export const useProfile = () => {
    const { user } = useAuth();

    return useQuery<Profile | null>({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            // RLS (Row Level Security) on the 'profiles' table ensures
            // users can only read their own profile.
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url, handicap, federation_code, phone, address, has_completed_onboarding, is_admin, is_premium, average_score, best_score, total_rounds')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
            }

            return data as unknown as Profile;
        },
        enabled: !!user?.id,
        initialData: () => {
            // Optimistic load from local storage
            const persisted = localStorage.getItem(PROFILE_CACHE_KEY);
            if (persisted) {
                try {
                    const parsed = JSON.parse(persisted) as Profile;
                    if (parsed.id === user?.id) return parsed;
                } catch (e) {
                    console.warn("Failed to parse persisted profile", e);
                    return undefined;
                }
            }
            return undefined;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

export const useUpdateProfile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return async (updates: Partial<Profile>) => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select('id, full_name, email, avatar_url, handicap, federation_code, phone, address, has_completed_onboarding, is_admin, is_premium, average_score, best_score, total_rounds')
            .single();

        if (error) throw error;

        queryClient.setQueryData(['profile', user.id], data);
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));

        return data as unknown as Profile;
    };
};

