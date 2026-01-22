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
                // Using fetch directly to avoid TypeScript issues with rpc
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) return;

                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/reset_expired_negotiations`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    }
                );

                if (!response.ok) {
                    console.error('Error resetting expired negotiations:', await response.text());
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
