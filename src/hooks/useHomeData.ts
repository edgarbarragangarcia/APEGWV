import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/SupabaseManager';

export const useFeaturedProducts = (limit = 4) => {
    return useQuery({
        queryKey: ['products', 'featured', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data.map(p => ({
                ...p,
                price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
            }));
        },
        staleTime: 1000 * 60 * 30, // 30 minutos
    });
};

export const useUpcomingTournaments = (limit = 3) => {
    return useQuery({
        queryKey: ['tournaments', 'upcoming', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .order('date', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hora
    });
};

export const useUserRoundCount = (userId?: string) => {
    return useQuery({
        queryKey: ['rounds', 'count', userId],
        queryFn: async () => {
            if (!userId) return 0;
            const { count, error } = await supabase
                .from('rounds')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!userId,
    });
};
