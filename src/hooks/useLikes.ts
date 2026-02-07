import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useLikes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const fetchLikes = useCallback(async () => {
        if (!user) {
            setLikedProducts(new Set());
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('product_likes' as any)
                .select('product_id')
                .eq('user_id', user.id);

            if (data && !error) {
                setLikedProducts(new Set((data as any[]).map(l => l.product_id)));
            }
        } catch (error) {
            console.error('Error fetching likes:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLikes();
    }, [fetchLikes]);

    const toggleLike = async (productId: string) => {
        if (!user) {
            navigate('/auth');
            return;
        }

        const isLiked = likedProducts.has(productId);

        // Optimistic UI update
        const newLiked = new Set(likedProducts);
        if (isLiked) newLiked.delete(productId);
        else newLiked.add(productId);
        setLikedProducts(newLiked);

        try {
            if (isLiked) {
                await (supabase
                    .from('product_likes' as any)
                    .delete() as any)
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
            } else {
                await (supabase
                    .from('product_likes' as any)
                    .insert({ user_id: user.id, product_id: productId } as any) as any);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Rollback on error
            setLikedProducts(new Set(likedProducts));
        }
    };

    return {
        likedProducts,
        toggleLike,
        isLoading,
        refreshLikes: fetchLikes
    };
};
