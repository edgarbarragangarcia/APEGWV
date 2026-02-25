import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/SupabaseManager';

export const useFeaturedProducts = (limit: number | null = null) => {
    return useQuery({
        queryKey: ['products', 'featured', limit],
        queryFn: async () => {
            let query = supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data.map(p => ({
                ...p,
                price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
            }));
        },
        staleTime: 1000 * 30, // 30 segundos
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

export const useCategories = (userId?: string) => {
    return useQuery({
        queryKey: ['products', 'categories', userId],
        queryFn: async () => {
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('category')
                .not('category', 'is', null);

            if (productsError) throw productsError;

            // Get unique, non-empty categories and capitalize
            const formattedCategories = productsData
                .map(p => p.category)
                .filter((cat): cat is string => cat !== null && cat.trim() !== '')
                .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());

            const baseCategories = Array.from(new Set(formattedCategories)).sort();

            if (!userId) {
                return ['Todo', ...baseCategories];
            }

            // Fetch personalization data
            const { data: interactionData, error: interactionError } = await supabase
                .from('user_interactions')
                .select('item_name, view_count, total_seconds')
                .eq('user_id', userId)
                .eq('item_type', 'category');

            if (interactionError || !interactionData || interactionData.length === 0) {
                return ['Todo', ...baseCategories.sort()];
            }

            // Create a map of scores
            const scores = new Map<string, number>();
            interactionData.forEach(item => {
                // Weight: 10 points per view, 1 point per minute viewed
                const score = (item.view_count || 0) * 10 + ((item.total_seconds || 0) / 60);
                scores.set(item.item_name.toLowerCase(), score);
            });

            // Sort categories based on score
            const sortedCategories = baseCategories.sort((a, b) => {
                const scoreA = scores.get(a.toLowerCase()) || 0;
                const scoreB = scores.get(b.toLowerCase()) || 0;

                if (scoreB !== scoreA) {
                    return scoreB - scoreA;
                }
                return a.localeCompare(b); // Fallback to alphabetical
            });

            return ['Todo', ...sortedCategories];
        },
        staleTime: 1000 * 60, // 1 minuto
    });
};
