import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/SupabaseManager';
import type { Product } from '../services/SupabaseManager';

interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    totalItems: number;
    totalAmount: number;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load - from DB if logged in, otherwise localStorage
    useEffect(() => {
        const loadCart = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const { data, error } = await supabase
                    .from('cart_items')
                    .select('*, products(*)')
                    .eq('user_id', session.user.id);

                if (!error && data) {
                    const mappedItems: CartItem[] = data.map(item => ({
                        ...(item.products as any),
                        quantity: item.quantity
                    }));
                    setCartItems(mappedItems);
                }
            } else {
                const localCart = localStorage.getItem('apeg_cart');
                if (localCart) {
                    setCartItems(JSON.parse(localCart));
                }
            }
            setIsLoading(false);
        };

        loadCart();
    }, []);

    // Sync localStorage if not logged in
    useEffect(() => {
        const syncLocal = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                localStorage.setItem('apeg_cart', JSON.stringify(cartItems));
            }
        };
        syncLocal();
    }, [cartItems]);

    const addToCart = async (product: Product) => {
        const { data: { session } } = await supabase.auth.getSession();

        const existingItem = cartItems.find(item => item.id === product.id);

        if (session) {
            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('user_id', session.user.id)
                    .eq('product_id', product.id);
            } else {
                await supabase
                    .from('cart_items')
                    .insert({
                        user_id: session.user.id,
                        product_id: product.id,
                        quantity: 1
                    });
            }
        }

        if (existingItem) {
            setCartItems(prev => prev.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = async (productId: string) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', session.user.id)
                .eq('product_id', productId);
        }

        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        if (quantity < 1) return;

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            await supabase
                .from('cart_items')
                .update({ quantity })
                .eq('user_id', session.user.id)
                .eq('product_id', productId);
        }

        setCartItems(prev => prev.map(item =>
            item.id === productId ? { ...item, quantity } : item
        ));
    };

    const clearCart = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', session.user.id);
        }

        setCartItems([]);
    };

    const totalItems = useMemo(() =>
        cartItems.reduce((acc, item) => acc + item.quantity, 0),
        [cartItems]
    );

    const totalAmount = useMemo(() =>
        cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        [cartItems]
    );

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalItems,
            totalAmount,
            isLoading
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
