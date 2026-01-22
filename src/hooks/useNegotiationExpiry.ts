import { useEffect } from 'react';
import { supabase } from '../services/SupabaseManager';

/**
 * Hook to automatically reset expired negotiations
 * Runs every 30 seconds to check for expired negotiations
 */
export const useNegotiationExpiry = () => {
    useEffect(() => {
        const resetExpiredNegotiations = async () => {
            try {
                // Call the database function to reset expired negotiations
                const { error } = await supabase.rpc('reset_expired_negotiations' as any) as any;

                if (error) {
                    console.error('Error resetting expired negotiations:', error);
                    return;
                }

                // Always trigger a refresh event - the function will handle the logic
                window.dispatchEvent(new Event('negotiations-reset'));
            } catch (err) {
                console.error('Failed to reset expired negotiations:', err);
            }
        };

        // Run immediately on mount
        resetExpiredNegotiations();

        // Then run every 30 seconds
        const interval = setInterval(resetExpiredNegotiations, 30000);

        return () => clearInterval(interval);
    }, []);
};
