import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Reemplazar estas credenciales con las de tu proyecto de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
    description: string;
    price: number;
    category: string;
    image_url: string;
    seller_id: string;
    condition: string;
    created_at: string;
    status?: string;
    is_negotiable?: boolean;
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
    is_read: boolean;
    created_at: string;
}

/**
 * Optimizes a Supabase storage URL by applying transformations (resize, quality, format).
 * Falls back to the original URL if it's not a Supabase storage URL or if transformation isn't supported.
 */
export const optimizeImage = (url: string | null | undefined, _options: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {}) => {
    if (!url) return '';

    // NOTE: Supabase Image Transformation is a paid feature (Pro plan).
    // If you are on a Free plan, the /render/image endpoint will return an error or a broken image.
    // For now, we return the original URL to ensure reliability. 
    // You can uncomment the logic below if you have a Pro plan enabled.

    /*
    if (url.includes('supabase.co/storage/v1/object/public/')) {
        const { width = 500, height, quality = 80, resize = 'cover' } = options;
        const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        const params = new URLSearchParams();
        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        params.append('quality', quality.toString());
        params.append('resize', resize);
        params.append('format', 'webp');
        return `${renderUrl}?${params.toString()}`;
    }
    */

    return url;
};
