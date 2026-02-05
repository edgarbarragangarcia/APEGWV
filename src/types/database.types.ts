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
            cart_items: {
                Row: {
                    created_at: string
                    id: string
                    product_id: string
                    quantity: number
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    product_id: string
                    quantity?: number
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    product_id?: string
                    quantity?: number
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "cart_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
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
                    {
                        foreignKeyName: "orders_buyer_id_fkey"
                        columns: ["buyer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            coupons: {
                Row: {
                    code: string
                    created_at: string
                    description: string | null
                    discount_type: string
                    discount_value: number
                    id: string
                    is_active: boolean | null
                    min_purchase_amount: number | null
                    product_id: string | null
                    seller_id: string
                    start_date: string | null
                    end_date: string | null
                    usage_limit: number | null
                    usage_count: number | null
                }
                Insert: {
                    code: string
                    created_at?: string
                    description?: string | null
                    discount_type: string
                    discount_value: number
                    id?: string
                    is_active?: boolean | null
                    min_purchase_amount?: number | null
                    product_id?: string | null
                    seller_id: string
                    start_date?: string | null
                    end_date?: string | null
                    usage_limit?: number | null
                    usage_count?: number | null
                }
                Update: {
                    code?: string
                    created_at?: string
                    description?: string | null
                    discount_type?: string
                    discount_value?: number
                    id?: string
                    is_active?: boolean | null
                    min_purchase_amount?: number | null
                    product_id?: string | null
                    seller_id?: string
                    start_date?: string | null
                    end_date?: string | null
                    usage_limit?: number | null
                    usage_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "coupons_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_blocked_days: {
                Row: {
                    blocked_date: string
                    course_id: string | null
                    created_at: string | null
                    id: string
                    reason: string | null
                }
                Insert: {
                    blocked_date: string
                    course_id?: string | null
                    created_at?: string | null
                    id?: string
                    reason?: string | null
                }
                Update: {
                    blocked_date?: string
                    course_id?: string | null
                    created_at?: string | null
                    id?: string
                    reason?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "course_blocked_days_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "golf_courses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_holes: {
                Row: {
                    course_id: string
                    handicap: number | null
                    id: string
                    lat: number | null
                    lon: number | null
                    number: number
                    par: number
                }
                Insert: {
                    course_id: string
                    handicap?: number | null
                    id?: string
                    lat?: number | null
                    lon?: number | null
                    number: number
                    par: number
                }
                Update: {
                    course_id?: string
                    handicap?: number | null
                    id?: string
                    lat?: number | null
                    lon?: number | null
                    number?: number
                    par?: number
                }
                Relationships: []
            }
            course_price_overrides: {
                Row: {
                    course_id: string | null
                    created_at: string | null
                    end_date: string
                    id: string
                    note: string | null
                    price: number
                    start_date: string
                }
                Insert: {
                    course_id?: string | null
                    created_at?: string | null
                    end_date: string
                    id?: string
                    note?: string | null
                    price: number
                    start_date: string
                }
                Update: {
                    course_id?: string | null
                    created_at?: string | null
                    end_date?: string
                    id?: string
                    note?: string | null
                    price?: number
                    start_date?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_price_overrides_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "golf_courses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            game_groups: {
                Row: {
                    course_id: string | null
                    created_at: string
                    created_by: string | null
                    id: string
                    status: string | null
                }
                Insert: {
                    course_id?: string | null
                    created_at?: string
                    created_by?: string | null
                    id?: string
                    status?: string | null
                }
                Update: {
                    course_id?: string | null
                    created_at?: string
                    created_by?: string | null
                    id?: string
                    status?: string | null
                }
                Relationships: []
            }
            golf_courses: {
                Row: {
                    address: string | null
                    caddy_included: boolean | null
                    created_at: string | null
                    description: string | null
                    holes: number | null
                    id: string
                    image_url: string | null
                    location: string | null
                    name: string
                    price_weekday: number | null
                    price_weekend: number | null
                    rating: number | null
                    source: string | null
                    status: string | null
                }
                Insert: {
                    address?: string | null
                    caddy_included?: boolean | null
                    created_at?: string | null
                    description?: string | null
                    holes?: number | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    name: string
                    price_weekday?: number | null
                    price_weekend?: number | null
                    rating?: number | null
                    source?: string | null
                    status?: string | null
                }
                Update: {
                    address?: string | null
                    caddy_included?: boolean | null
                    created_at?: string | null
                    description?: string | null
                    holes?: number | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    name?: string
                    price_weekday?: number | null
                    price_weekend?: number | null
                    rating?: number | null
                    source?: string | null
                    status?: string | null
                }
                Relationships: []
            }
            group_members: {
                Row: {
                    created_at: string
                    group_id: string | null
                    id: string
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    group_id?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    group_id?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "group_members_group_id_fkey"
                        columns: ["group_id"]
                        isOneToOne: false
                        referencedRelation: "game_groups"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "group_members_user_id_profiles_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            messages: {
                Row: {
                    chat_id: string | null
                    content: string
                    created_at: string | null
                    id: string
                    sender_id: string | null
                }
                Insert: {
                    chat_id?: string | null
                    content: string
                    created_at?: string | null
                    id?: string
                    sender_id?: string | null
                }
                Update: {
                    chat_id?: string | null
                    content?: string
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
            notifications: {
                Row: {
                    created_at: string | null
                    id: string
                    message: string
                    read: boolean | null
                    title: string
                    type: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    message: string
                    read?: boolean | null
                    title: string
                    type: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    message?: string
                    read?: boolean | null
                    title?: string
                    type?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            offers: {
                Row: {
                    amount: number
                    buyer_id: string | null
                    counter_amount: number | null
                    counter_message: string | null
                    created_at: string | null
                    id: string
                    message: string | null
                    product_id: string | null
                    seller_id: string | null
                    status: string | null
                }
                Insert: {
                    amount: number
                    buyer_id?: string | null
                    counter_amount?: number | null
                    counter_message?: string | null
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    product_id?: string | null
                    seller_id?: string | null
                    status?: string | null
                }
                Update: {
                    amount?: number
                    buyer_id?: string | null
                    counter_amount?: number | null
                    counter_message?: string | null
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    product_id?: string | null
                    seller_id?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "offers_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    price_at_purchase: number
                    product_id: string
                    quantity: number
                }
                Insert: {
                    id?: string
                    order_id: string
                    price_at_purchase: number
                    product_id: string
                    quantity: number
                }
                Update: {
                    id?: string
                    order_id?: string
                    price_at_purchase?: number
                    product_id?: string
                    quantity?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            orders: {
                Row: {
                    buyer_id: string
                    buyer_name: string | null
                    buyer_phone: string | null
                    created_at: string
                    id: string
                    seller_id: string
                    seller_net_amount: number
                    shipping_address: string | null
                    status: string
                    total_amount: number
                    tracking_number: string | null
                    tracking_provider: string | null
                    updated_at: string | null
                }
                Insert: {
                    buyer_id: string
                    buyer_name?: string | null
                    buyer_phone?: string | null
                    created_at?: string
                    id?: string
                    seller_id: string
                    seller_net_amount: number
                    shipping_address?: string | null
                    status?: string
                    total_amount: number
                    tracking_number?: string | null
                    tracking_provider?: string | null
                    updated_at?: string | null
                }
                Update: {
                    buyer_id?: string
                    buyer_name?: string | null
                    buyer_phone?: string | null
                    created_at?: string
                    id?: string
                    seller_id?: string
                    seller_net_amount?: number
                    shipping_address?: string | null
                    status?: string
                    total_amount?: number
                    tracking_number?: string | null
                    tracking_provider?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_buyer_id_fkey"
                        columns: ["buyer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payment_methods: {
                Row: {
                    id: string
                    user_id: string
                    is_default: boolean | null
                    created_at: string | null
                    expiry: string
                    card_type: string
                    card_holder: string
                    last_four: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    is_default?: boolean | null
                    created_at?: string | null
                    expiry: string
                    card_type: string
                    card_holder: string
                    last_four: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    is_default?: boolean | null
                    created_at?: string | null
                    expiry?: string
                    card_type?: string
                    card_holder?: string
                    last_four?: string
                }
                Relationships: []
            }
            products: {
                Row: {
                    category: string
                    clothing_type: string | null
                    condition: string
                    created_at: string | null
                    description: string
                    id: string
                    image_url: string
                    is_negotiable: boolean
                    name: string
                    negotiating_buyer_id: string | null
                    negotiation_expires_at: string | null
                    price: number
                    seller_id: string | null
                    size_clothing: string | null
                    size_shoes_cm: string | null
                    size_shoes_col: string | null
                    size_shoes_eu: string | null
                    size_shoes_us: string | null
                    status: string | null
                    stock_quantity: number | null
                    updated_at: string | null
                }
                Insert: {
                    category: string
                    clothing_type?: string | null
                    condition: string
                    created_at?: string | null
                    description: string
                    id?: string
                    image_url: string
                    is_negotiable?: boolean
                    name: string
                    negotiating_buyer_id?: string | null
                    negotiation_expires_at?: string | null
                    price: number
                    seller_id?: string | null
                    size_clothing?: string | null
                    size_shoes_cm?: string | null
                    size_shoes_col?: string | null
                    size_shoes_eu?: string | null
                    size_shoes_us?: string | null
                    status?: string | null
                    stock_quantity?: number | null
                    updated_at?: string | null
                }
                Update: {
                    category?: string
                    clothing_type?: string | null
                    condition?: string
                    created_at?: string | null
                    description?: string
                    id?: string
                    image_url?: string
                    is_negotiable?: boolean
                    name?: string
                    negotiating_buyer_id?: string | null
                    negotiation_expires_at?: string | null
                    price?: number
                    seller_id?: string | null
                    size_clothing?: string | null
                    size_shoes_cm?: string | null
                    size_shoes_col?: string | null
                    size_shoes_eu?: string | null
                    size_shoes_us?: string | null
                    status?: string | null
                    stock_quantity?: number | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    address: string | null
                    average_score: number | null
                    best_score: number | null
                    email: string | null
                    fairways_hit_rate: number | null
                    federation_code: string | null
                    full_name: string | null
                    handicap: number | null
                    has_completed_onboarding: boolean | null
                    id: string
                    id_photo_url: string | null
                    is_premium: boolean | null
                    phone: string | null
                    putts_avg: number | null
                    total_rounds: number | null
                    updated_at: string | null
                }
                Insert: {
                    address?: string | null
                    average_score?: number | null
                    best_score?: number | null
                    email?: string | null
                    fairways_hit_rate?: number | null
                    federation_code?: string | null
                    full_name?: string | null
                    handicap?: number | null
                    has_completed_onboarding?: boolean | null
                    id: string
                    id_photo_url?: string | null
                    is_premium?: boolean | null
                    phone?: string | null
                    putts_avg?: number | null
                    total_rounds?: number | null
                    updated_at?: string | null
                }
                Update: {
                    address?: string | null
                    average_score?: number | null
                    best_score?: number | null
                    email?: string | null
                    fairways_hit_rate?: number | null
                    federation_code?: string | null
                    full_name?: string | null
                    handicap?: number | null
                    has_completed_onboarding?: boolean | null
                    id?: string
                    id_photo_url?: string | null
                    is_premium?: boolean | null
                    phone?: string | null
                    putts_avg?: number | null
                    total_rounds?: number | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            reservations: {
                Row: {
                    course_id: string
                    created_at: string | null
                    date: string
                    id: string
                    players_count: number
                    price: number
                    status: string | null
                    time: string
                    user_id: string | null
                }
                Insert: {
                    course_id: string
                    created_at?: string | null
                    date: string
                    id?: string
                    players_count: number
                    price: number
                    status?: string | null
                    time: string
                    user_id?: string | null
                }
                Update: {
                    course_id?: string
                    created_at?: string | null
                    date?: string
                    id?: string
                    players_count?: number
                    price?: number
                    status?: string | null
                    time?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            round_holes: {
                Row: {
                    created_at: string
                    hole_number: number
                    id: string
                    par: number
                    round_id: string
                    score: number
                }
                Insert: {
                    created_at?: string
                    hole_number: number
                    id?: string
                    par: number
                    round_id: string
                    score: number
                }
                Update: {
                    created_at?: string
                    hole_number?: number
                    id?: string
                    par?: number
                    round_id?: string
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
                    ai_analysis: string | null
                    course_location: string | null
                    course_name: string
                    created_at: string
                    date_played: string
                    fairways_hit: number | null
                    first_nine_score: number | null
                    greens_in_regulation: number | null
                    group_id: string | null
                    id: string
                    notes: string | null
                    second_nine_score: number | null
                    status: string | null
                    total_putts: number | null
                    total_score: number | null
                    updated_at: string | null
                    user_id: string
                    weather_conditions: string | null
                }
                Insert: {
                    ai_analysis?: string | null
                    course_location?: string | null
                    course_name: string
                    created_at?: string
                    date_played: string
                    fairways_hit?: number | null
                    first_nine_score?: number | null
                    greens_in_regulation?: number | null
                    group_id?: string | null
                    id?: string
                    notes?: string | null
                    second_nine_score?: number | null
                    status?: string | null
                    total_putts?: number | null
                    total_score?: number | null
                    updated_at?: string | null
                    user_id: string
                    weather_conditions?: string | null
                }
                Update: {
                    ai_analysis?: string | null
                    course_location?: string | null
                    course_name?: string
                    created_at?: string
                    date_played?: string
                    fairways_hit?: number | null
                    first_nine_score?: number | null
                    greens_in_regulation?: number | null
                    group_id?: string | null
                    id?: string
                    notes?: string | null
                    second_nine_score?: number | null
                    status?: string | null
                    total_putts?: number | null
                    total_score?: number | null
                    updated_at?: string | null
                    user_id?: string
                    weather_conditions?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "rounds_group_id_fkey"
                        columns: ["group_id"]
                        isOneToOne: false
                        referencedRelation: "game_groups"
                        referencedColumns: ["id"]
                    },
                ]
            }
            seller_profiles: {
                Row: {
                    account_holder_document: string | null
                    account_holder_name: string | null
                    account_number: string | null
                    account_type: string | null
                    bank_name: string | null
                    company_name: string | null
                    created_at: string | null
                    document_number: string | null
                    document_type: string | null
                    entity_type: string | null
                    full_name: string | null
                    id: string
                    legal_representative: string | null
                    nit: string | null
                    status: string | null
                    store_name: string | null
                    user_id: string
                }
                Insert: {
                    account_holder_document?: string | null
                    account_holder_name?: string | null
                    account_number?: string | null
                    account_type?: string | null
                    bank_name?: string | null
                    company_name?: string | null
                    created_at?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    entity_type?: string | null
                    full_name?: string | null
                    id?: string
                    legal_representative?: string | null
                    nit?: string | null
                    status?: string | null
                    store_name?: string | null
                    user_id: string
                }
                Update: {
                    account_holder_document?: string | null
                    account_holder_name?: string | null
                    account_number?: string | null
                    account_type?: string | null
                    bank_name?: string | null
                    company_name?: string | null
                    created_at?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    entity_type?: string | null
                    full_name?: string | null
                    id?: string
                    legal_representative?: string | null
                    nit?: string | null
                    status?: string | null
                    store_name?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            tournament_registrations: {
                Row: {
                    created_at: string | null
                    id: string
                    status: string | null
                    tournament_id: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    status?: string | null
                    tournament_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    status?: string | null
                    tournament_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tournament_registrations_tournament_id_fkey"
                        columns: ["tournament_id"]
                        isOneToOne: false
                        referencedRelation: "tournaments"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tournaments: {
                Row: {
                    address: string | null
                    course_id: string | null
                    created_at: string | null
                    creator_id: string | null
                    date: string
                    description: string
                    game_mode: string | null
                    id: string
                    image_url: string | null
                    name: string
                    participants_limit: number | null
                    price: number
                    status: string | null
                }
                Insert: {
                    address?: string | null
                    course_id?: string | null
                    created_at?: string | null
                    creator_id?: string | null
                    date: string
                    description: string
                    game_mode?: string | null
                    id?: string
                    image_url?: string | null
                    name: string
                    participants_limit?: number | null
                    price: number
                    status?: string | null
                }
                Update: {
                    address?: string | null
                    course_id?: string | null
                    created_at?: string | null
                    creator_id?: string | null
                    date?: string
                    description?: string
                    game_mode?: string | null
                    id?: string
                    image_url?: string | null
                    name?: string
                    participants_limit?: number | null
                    price?: number
                    status?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            is_group_member: {
                Args: {
                    gid: string
                }
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
