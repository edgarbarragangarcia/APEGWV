import { createClient } from '@supabase/supabase-js';

// Reemplazar estas credenciales con las de tu proyecto de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    condition: 'Nuevo' | 'Usado';
    created_at: string;
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
