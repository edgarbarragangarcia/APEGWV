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
                ]
            }
            course_holes: {
                Row: {
                    id: string
                    course_id: string
                    recorrido: string | null
                    hole_number: number
                    par: number
                    handicap: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    course_id: string
                    recorrido?: string | null
                    hole_number: number
                    par: number
                    handicap?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    course_id?: string
                    recorrido?: string | null
                    hole_number?: number
                    par?: number
                    handicap?: number | null
                    created_at?: string | null
                }
                Relationships: []
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
                    link: string | null
                    message: string
                    read: boolean | null
                    title: string
                    type: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    link?: string | null
                    message: string
                    read?: boolean | null
                    title: string
                    type?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    link?: string | null
                    message?: string
                    read?: boolean | null
                    title?: string
                    type?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            offers: {
                Row: {
                    buyer_id: string
                    created_at: string | null
                    id: string
                    message: string | null
                    offer_amount: number
                    product_id: string
                    seller_id: string
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    buyer_id: string
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    offer_amount: number
                    product_id: string
                    seller_id: string
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    buyer_id?: string
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    offer_amount?: number
                    product_id?: string
                    seller_id?: string
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "offers_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string | null
                    quantity: number
                    price_at_purchase: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id?: string | null
                    quantity: number
                    price_at_purchase: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string | null
                    quantity?: number
                    price_at_purchase?: number
                    created_at?: string
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
                    }
                ]
            }
            orders: {
                Row: {
                    buyer_id: string | null
                    buyer_name: string | null
                    buyer_phone: string | null
                    commission_amount: number
                    created_at: string | null
                    id: string
                    items: Json | null
                    product_id: string | null
                    seller_id: string | null
                    seller_net_amount: number
                    shipping_address: string
                    shipping_provider: string | null
                    status: string | null
                    total_amount: number
                    tracking_number: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    buyer_id?: string | null
                    buyer_name?: string | null
                    buyer_phone?: string | null
                    commission_amount?: number
                    created_at?: string | null
                    id?: string
                    items?: Json | null
                    product_id?: string | null
                    seller_id?: string | null
                    seller_net_amount?: number
                    shipping_address: string
                    shipping_provider?: string | null
                    status?: string | null
                    total_amount: number
                    tracking_number?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    buyer_id?: string | null
                    buyer_name?: string | null
                    buyer_phone?: string | null
                    commission_amount?: number
                    created_at?: string | null
                    id?: string
                    items?: Json | null
                    product_id?: string | null
                    seller_id?: string | null
                    seller_net_amount?: number
                    shipping_address?: string
                    shipping_provider?: string | null
                    status?: string | null
                    total_amount?: number
                    tracking_number?: string | null
                    updated_at?: string | null
                    user_id?: string | null
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
                        foreignKeyName: "orders_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            payment_methods: {
                Row: {
                    card_holder: string
                    card_type: string
                    created_at: string | null
                    expiry: string
                    id: string
                    is_default: boolean | null
                    last_four: string
                    user_id: string | null
                }
                Insert: {
                    card_holder: string
                    card_type: string
                    created_at?: string | null
                    expiry: string
                    id?: string
                    is_default?: boolean | null
                    last_four: string
                    user_id?: string | null
                }
                Update: {
                    card_holder?: string
                    card_type?: string
                    created_at?: string | null
                    expiry?: string
                    id?: string
                    is_default?: boolean | null
                    last_four?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            products: {
                Row: {
                    brand: string | null
                    category: string | null
                    clothing_type: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    images: string[] | null
                    is_negotiable: boolean | null
                    name: string
                    price: number
                    seller_id: string
                    size: string | null
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
                    brand?: string | null
                    category?: string | null
                    clothing_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    images?: string[] | null
                    is_negotiable?: boolean | null
                    name: string
                    price: number
                    seller_id: string
                    size?: string | null
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
                    brand?: string | null
                    category?: string | null
                    clothing_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    images?: string[] | null
                    is_negotiable?: boolean | null
                    name?: string
                    price?: number
                    seller_id?: string
                    size?: string | null
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
                    club_id: string | null
                    created_at: string | null
                    date: string
                    id: string
                    status: string | null
                    time: string
                    user_id: string | null
                }
                Insert: {
                    club_id?: string | null
                    created_at?: string | null
                    date: string
                    id?: string
                    status?: string | null
                    time: string
                    user_id?: string | null
                }
                Update: {
                    club_id?: string | null
                    created_at?: string | null
                    date?: string
                    id?: string
                    status?: string | null
                    time?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            reviews: {
                Row: {
                    id: string
                    product_id: string | null
                    reviewer_id: string | null
                    rating: number
                    comment: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    reviewer_id?: string | null
                    rating: number
                    comment?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    reviewer_id?: string | null
                    rating?: number
                    comment?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reviews_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_reviewer_id_fkey"
                        columns: ["reviewer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            round_holes: {
                Row: {
                    id: string
                    round_id: string
                    hole_number: number
                    par: number
                    score: number
                    putts: number | null
                    fairway_hit: boolean | null
                    gir: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    round_id: string
                    hole_number: number
                    par: number
                    score: number
                    putts?: number | null
                    fairway_hit?: boolean | null
                    gir?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    round_id?: string
                    hole_number?: number
                    par?: number
                    score?: number
                    putts?: number | null
                    fairway_hit?: boolean | null
                    gir?: boolean | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "round_holes_round_id_fkey"
                        columns: ["round_id"]
                        isOneToOne: false
                        referencedRelation: "rounds"
                        referencedColumns: ["id"]
                    }
                ]
            }
            round_scores: {
                Row: {
                    id: string
                    round_id: string
                    hole_number: number
                    par: number
                    score: number
                    fairways_hit: boolean | null
                    gir: boolean | null
                    putts: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    round_id: string
                    hole_number: number
                    par: number
                    score: number
                    fairways_hit?: boolean | null
                    gir?: boolean | null
                    putts?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    round_id?: string
                    hole_number?: number
                    par?: number
                    score?: number
                    fairways_hit?: boolean | null
                    gir?: boolean | null
                    putts?: number | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "round_scores_round_id_fkey"
                        columns: ["round_id"]
                        isOneToOne: false
                        referencedRelation: "rounds"
                        referencedColumns: ["id"]
                    }
                ]
            }
            rounds: {
                Row: {
                    id: string
                    user_id: string
                    course_name: string
                    course_location: string | null
                    date_played: string
                    total_score: number | null
                    status: string | null
                    created_at: string
                    first_nine_score: number | null
                    second_nine_score: number | null
                    total_putts: number | null
                    fairways_hit: number | null
                    greens_in_regulation: number | null
                    weather_conditions: string | null
                    notes: string | null
                    ai_analysis: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    course_name: string
                    course_location?: string | null
                    date_played: string
                    total_score?: number | null
                    status?: string | null
                    created_at?: string
                    first_nine_score?: number | null
                    second_nine_score?: number | null
                    total_putts?: number | null
                    fairways_hit?: number | null
                    greens_in_regulation?: number | null
                    weather_conditions?: string | null
                    notes?: string | null
                    ai_analysis?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    course_name?: string
                    course_location?: string | null
                    date_played?: string
                    total_score?: number | null
                    status?: string | null
                    created_at?: string
                    first_nine_score?: number | null
                    second_nine_score?: number | null
                    total_putts?: number | null
                    fairways_hit?: number | null
                    greens_in_regulation?: number | null
                    weather_conditions?: string | null
                    notes?: string | null
                    ai_analysis?: string | null
                    updated_at?: string | null
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
            seller_profiles: {
                Row: {
                    account_holder_document: string
                    account_holder_name: string
                    account_number: string
                    account_type: string
                    bank_name: string
                    company_name: string | null
                    created_at: string | null
                    document_number: string | null
                    document_type: string | null
                    entity_type: string
                    full_name: string | null
                    id: string
                    legal_representative: string | null
                    nit: string | null
                    status: string | null
                    store_name: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    account_holder_document: string
                    account_holder_name: string
                    account_number: string
                    account_type: string
                    bank_name: string
                    company_name?: string | null
                    created_at?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    entity_type: string
                    full_name?: string | null
                    id?: string
                    legal_representative?: string | null
                    nit?: string | null
                    status?: string | null
                    store_name: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    account_holder_document?: string
                    account_holder_name?: string
                    account_number?: string
                    account_type?: string
                    bank_name?: string
                    company_name?: string | null
                    created_at?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    entity_type?: string
                    full_name?: string | null
                    id?: string
                    legal_representative?: string | null
                    nit?: string | null
                    status?: string | null
                    store_name?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            tournament_registrations: {
                Row: {
                    created_at: string | null
                    id: string
                    registration_status: string | null
                    tournament_id: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    registration_status?: string | null
                    tournament_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    registration_status?: string | null
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
                    {
                        foreignKeyName: "tournament_registrations_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tournaments: {
                Row: {
                    created_at: string | null
                    date: string
                    description: string | null
                    id: string
                    image_url: string | null
                    location: string | null
                    max_participants: number | null
                    name: string
                    club: string
                    price: number
                    participants_limit: number | null
                    current_participants: number | null
                    status: string | null
                    creator_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    date: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    max_participants?: number | null
                    name: string
                    club: string
                    price: number
                    participants_limit?: number | null
                    current_participants?: number | null
                    status?: string | null
                    creator_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    date?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    max_participants?: number | null
                    name?: string
                    club?: string
                    price?: number
                    participants_limit?: number | null
                    current_participants?: number | null
                    status?: string | null
                    creator_id?: string | null
                    updated_at?: string | null
                }
                Relationships: []
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

type PublicSchema = Database["public"]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] &
    { Tables: any; Views: any })["Tables" | "Views"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] &
    { Tables: any; Views: any })["Tables" | "Views"][TableName] extends {
        Row: infer R
    }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] &
    { Tables: any })["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] &
    { Tables: any })["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] &
    { Tables: any })["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] &
    { Tables: any })["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions["schema"]] &
    { Enums: any })["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicEnumNameOrOptions["schema"]] &
    { Enums: any })["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
