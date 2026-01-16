export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    updated_at: string | null
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    website: string | null
                    email: string | null
                    federation_code: string | null
                    id_photo_url: string | null
                    is_premium: boolean | null
                    handicap: number | null
                }
                Insert: {
                    id: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    email?: string | null
                    federation_code?: string | null
                    id_photo_url?: string | null
                    is_premium?: boolean | null
                    handicap?: number | null
                }
                Update: {
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    email?: string | null
                    federation_code?: string | null
                    id_photo_url?: string | null
                    is_premium?: boolean | null
                    handicap?: number | null
                }
            }
            player_stats: {
                Row: {
                    id: string
                    user_id: string
                    average_score: number
                    putts_avg: number
                    fairways_hit_rate: number
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    average_score?: number
                    putts_avg?: number
                    fairways_hit_rate?: number
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    average_score?: number
                    putts_avg?: number
                    fairways_hit_rate?: number
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
        }
    }
}
