import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';

export const useInteractions = () => {
    const { session } = useAuth();
    const userId = session?.user?.id;

    const logView = async (itemType: 'category' | 'product', itemName: string) => {
        if (!userId) return;

        try {
            await supabase.rpc('increment_interaction', {
                p_user_id: userId,
                p_item_type: itemType,
                p_item_name: itemName,
                p_increment_view: true,
                p_seconds_to_add: 0
            });
        } catch (err) {
            console.error('Error logging view interaction:', err);
        }
    };

    const logDuration = async (itemType: 'category' | 'product', itemName: string, seconds: number) => {
        if (!userId || seconds <= 0) return;

        try {
            await supabase.rpc('increment_interaction', {
                p_user_id: userId,
                p_item_type: itemType,
                p_item_name: itemName,
                p_increment_view: false,
                p_seconds_to_add: Math.round(seconds)
            });
        } catch (err) {
            console.error('Error logging duration interaction:', err);
        }
    };

    return { logView, logDuration };
};
