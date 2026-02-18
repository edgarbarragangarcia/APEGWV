import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';

// Define a type for the Profile to avoid 'any'
// Ideally this comes from your generated database types (supabase-js)
export interface Profile {
    id: string;
    full_name: string | null;
    handicap: number | null;
    federation_code: string | null;
    id_photo_url: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    department_id: number | null;
    city_id: number | null;
    updated_at: string;
    // Add other fields as necessary
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
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            // Sync to local storage for offline-first feeling / faster initial load on next boot
            if (data) {
                localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
            }

            return data as Profile;
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
            .select()
            .single();

        if (error) throw error;

        // Update React Query cache immediately
        queryClient.setQueryData(['profile', user.id], data);

        // Update local storage to keep in sync
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));

        return data as Profile;
    };
};

