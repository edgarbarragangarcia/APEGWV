import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';

const PROFILE_CACHE_KEY = 'user-profile-persistence';

export const useProfile = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            // Guardar en localStorage para persistencia rápida
            if (data) {
                localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
            }

            return data;
        },
        enabled: !!user?.id,
        // Usar datos persistidos como "initialData" para que la UI no parpadee
        initialData: () => {
            const persisted = localStorage.getItem(PROFILE_CACHE_KEY);
            if (persisted) {
                try {
                    const parsed = JSON.parse(persisted);
                    // Solo devolver si el ID coincide con el usuario actual
                    if (parsed.id === user?.id) return parsed;
                } catch (e) {
                    return undefined;
                }
            }
            return undefined;
        },
        staleTime: 1000 * 60 * 10, // Considerar datos "frescos" por 10 minutos
    });
};

export const useUpdateProfile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return async (updates: any) => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché para forzar actualización
        queryClient.setQueryData(['profile', user.id], data);
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));

        return data;
    };
};
