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
            chats: {
                Row: {
                    buyer_id: string | null
                    created_at: string | null
                    id: string
                    product_id: string | null
                    seller_id: string | null
                }
                Insert: {
                    buyer_id?: string | null
                    created_at?: string | null
                    id?: string
                    product_id?: string | null
                    seller_id?: string | null
                }
                Update: {
                    buyer_id?: string | null
                    created_at?: string | null
                    id?: string
                    product_id?: string | null
                    seller_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "chats_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_holes: {
                Row: {
                    course_id: string
                    created_at: string | null
                    handicap: number | null
                    hole_number: number
                    id: string
                    par: number
                    recorrido: string | null
                }
                Insert: {
                    course_id: string
                    created_at?: string | null
                    handicap?: number | null
                    hole_number: number
                    id?: string
                    par: number
                    recorrido?: string | null
                }
                Update: {
                    course_id?: string
                    created_at?: string | null
                    handicap?: number | null
                    hole_number?: number
                    id?: string
                    par?: number
                    recorrido?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "course_holes_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            courses: {
                Row: {
                    city: string | null
                    country: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    latitude: number | null
                    longitude: number | null
                    name: string
                    par_total: number | null
                }
                Insert: {
                    city?: string | null
                    country?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    name: string
                    par_total?: number | null
                }
                Update: {
                    city?: string | null
                    country?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    name?: string
                    par_total?: number | null
                }
                Relationships: []
            }
            messages: {
                Row: {
                    chat_id: string | null
                    content: string | null
                    created_at: string | null
                    id: string
                    sender_id: string | null
                }
                Insert: {
                    chat_id?: string | null
                    content?: string | null
                    created_at?: string | null
                    id?: string
                    sender_id?: string | null
                }
                Update: {
                    chat_id?: string | null
                    content?: string | null
                    created_at?: string | null
                    id?: string
                    sender_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "chats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            player_stats: {
                Row: {
                    average_score: number | null
                    created_at: string | null
                    fairways_hit_rate: number | null
                    id: string
                    putts_avg: number | null
                    rounds_played: number | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    average_score?: number | null
                    created_at?: string | null
                    fairways_hit_rate?: number | null
                    id?: string
                    putts_avg?: number | null
                    rounds_played?: number | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    average_score?: number | null
                    created_at?: string | null
                    fairways_hit_rate?: number | null
                    id?: string
                    putts_avg?: number | null
                    rounds_played?: number | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "player_stats_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    category: string | null
                    condition: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    name: string
                    price: number
                    seller_id: string | null
                }
                Insert: {
                    category?: string | null
                    condition?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name: string
                    price: number
                    seller_id?: string | null
                }
                Update: {
                    category?: string | null
                    condition?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name?: string
                    price?: number
                    seller_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "products_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    email: string | null
                    federation_code: string | null
                    full_name: string | null
                    handicap: number | null
                    id: string
                    id_photo_url: string | null
                    is_premium: boolean | null
                    phone: string | null
                    updated_at: string | null
                    username: string | null
                    website: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    email?: string | null
                    federation_code?: string | null
                    full_name?: string | null
                    handicap?: number | null
                    id: string
                    id_photo_url?: string | null
                    is_premium?: boolean | null
                    phone?: string | null
                    updated_at?: string | null
                    username?: string | null
                    website?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    email?: string | null
                    federation_code?: string | null
                    full_name?: string | null
                    handicap?: number | null
                    id?: string
                    id_photo_url?: string | null
                    is_premium?: boolean | null
                    phone?: string | null
                    updated_at?: string | null
                    username?: string | null
                    website?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            round_holes: {
                Row: {
                    created_at: string | null
                    hole_number: number
                    id: string
                    par: number
                    round_id: string | null
                    score: number
                }
                Insert: {
                    created_at?: string | null
                    hole_number: number
                    id?: string
                    par: number
                    round_id?: string | null
                    score: number
                }
                Update: {
                    created_at?: string | null
                    hole_number?: number
                    id?: string
                    par?: number
                    round_id?: string | null
                    score?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "round_holes_round_id_fkey"
                        columns: ["round_id"]
                        isOneToOne: false
                        referencedRelation: "rounds"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rounds: {
                Row: {
                    course_location: string | null
                    course_name: string
                    created_at: string | null
                    date_played: string | null
                    first_nine_score: number | null
                    id: string
                    second_nine_score: number | null
                    status: string | null
                    total_score: number | null
                    user_id: string | null
                }
                Insert: {
                    course_location?: string | null
                    course_name: string
                    created_at?: string | null
                    date_played?: string | null
                    first_nine_score?: number | null
                    id?: string
                    second_nine_score?: number | null
                    status?: string | null
                    total_score?: number | null
                    user_id?: string | null
                }
                Update: {
                    course_location?: string | null
                    course_name?: string
                    created_at?: string | null
                    date_played?: string | null
                    first_nine_score?: number | null
                    id?: string
                    second_nine_score?: number | null
                    status?: string | null
                    total_score?: number | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "rounds_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
