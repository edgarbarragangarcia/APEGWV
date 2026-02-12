import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// La librería puede seguir usando la URL real para no romper nada interno
export const supabase = createClient<Database>(rawUrl, supabaseAnonKey);

export const manualLogin = async (email: string, password: string) => {
    // Usamos el proxy relativo para que no haya CORS
    const targetUrl = '/supabase-proxy/auth/v1/token?grant_type=password';

    console.log('--- BYPASS FINAL: Fetch a través de Proxy ---');

    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: 'Servidor no responde' }));
        throw new Error(errorData.error_description || errorData.msg || `Error ${response.status}`);
    }

    return await response.json();
};

// Interfaces para los datos de la aplicación
export interface UserProfile {
    id: string;
    full_name: string;
    handicap: number;
    federation_code: string;
    avatar_url?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    image_url: string | null;
    seller_id?: string | null;
    condition?: string;
    created_at?: string | null;
    status?: string | null;
    is_negotiable?: boolean | null;
    brand?: string | null;
    sizes_inventory?: { size: string; quantity: number }[] | null;
    images?: string[] | null;
    negotiating_buyer_id?: string | null;
    negotiation_expires_at?: string | null;
}

export interface Round {
    id: string;
    course_name: string;
    date: string;
    score: number;
    stats: {
        putts: number;
        fairways: boolean[];
        greens_in_regulation: number;
    };
}
export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
}

/**
 * Optimizes a Supabase storage URL by applying transformations (resize, quality, format).
 * Falls back to the original URL if it's not a Supabase storage URL or if transformation isn't supported.
 */
export const optimizeImage = (url: string | null | undefined, options: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {}) => {
    if (!url) return '';

    // If it's a relative path, assume it's from the products bucket
    if (url && !url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:')) {
        const { data } = supabase.storage.from('products').getPublicUrl(url);
        url = data.publicUrl;
    }

    // NOTE: Supabase Image Transformation is a paid feature (Pro plan).
    // If you are on a Free plan, the /render/image endpoint will return an error or a broken image.
    // For now, we only use the transformation if explicitly requested and we detect we might be on Pro (not easily detectable, so we'll be careful)

    // If the URL is already a public storage URL and we want to optimize it
    if (url.includes('supabase.co/storage/v1/object/public/') && (options.width || options.height)) {
        // Only uncomment/use if you have Supabase Pro Plan enabled
        /*
        const { width, height, quality = 80, resize = 'cover' } = options;
        const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        const params = new URLSearchParams();
        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        params.append('quality', quality.toString());
        params.append('resize', resize);
        params.append('format', 'webp');
        return `${renderUrl}?${params.toString()}`;
        */
    }

    return url;
};
