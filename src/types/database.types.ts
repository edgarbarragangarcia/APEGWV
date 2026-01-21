export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
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
                    }
                ]
            }
            seller_profiles: {
                Row: {
                    id: string
                    user_id: string
                    store_name: string
                    entity_type: 'natural' | 'juridica'
                    full_name: string | null
                    document_type: string | null
                    document_number: string | null
                    company_name: string | null
                    nit: string | null
                    legal_representative: string | null
                    bank_name: string
                    account_type: 'ahorros' | 'corriente'
                    account_number: string
                    account_holder_name: string
                    account_holder_document: string
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    store_name: string
                    entity_type: 'natural' | 'juridica'
                    full_name?: string | null
                    document_type?: string | null
                    document_number?: string | null
                    company_name?: string | null
                    nit?: string | null
                    legal_representative?: string | null
                    bank_name: string
                    account_type: 'ahorros' | 'corriente'
                    account_number: string
                    account_holder_name: string
                    account_holder_document: string
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    store_name?: string
                    entity_type?: 'natural' | 'juridica'
                    full_name?: string | null
                    document_type?: string | null
                    document_number?: string | null
                    company_name?: string | null
                    nit?: string | null
                    legal_representative?: string | null
                    bank_name?: string
                    account_type?: 'ahorros' | 'corriente'
                    account_number?: string
                    account_holder_name?: string
                    account_holder_document?: string
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "seller_profiles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            products: {
                Row: {
                    id: string
                    price: number
                    stock_quantity: number
                    created_at: string
                    updated_at: string
                    seller_id: string
                    image_url: string | null
                    size_shoes_col: string | null
                    size_shoes_cm: string | null
                    clothing_type: string | null
                    status: string | null
                    images: string[]
                    size: string | null
                    size_clothing: string | null
                    size_shoes_us: string | null
                    name: string
                    brand: string | null
                    description: string | null
                    size_shoes_eu: string | null
                    category: string | null
                    is_negotiable: boolean
                }
                Insert: {
                    id?: string
                    price: number
                    stock_quantity?: number
                    created_at?: string
                    updated_at?: string
                    seller_id: string
                    image_url?: string | null
                    size_shoes_col?: string | null
                    size_shoes_cm?: string | null
                    clothing_type?: string | null
                    status?: string | null
                    images?: string[]
                    size?: string | null
                    size_clothing?: string | null
                    size_shoes_us?: string | null
                    name: string
                    brand?: string | null
                    description?: string | null
                    size_shoes_eu?: string | null
                    category?: string | null
                }
                Update: {
                    id?: string
                    price?: number
                    stock_quantity?: number
                    created_at?: string
                    updated_at?: string
                    seller_id?: string
                    image_url?: string | null
                    size_shoes_col?: string | null
                    size_shoes_cm?: string | null
                    clothing_type?: string | null
                    status?: string | null
                    images?: string[]
                    size?: string | null
                    size_clothing?: string | null
                    size_shoes_us?: string | null
                    name?: string
                    brand?: string | null
                    description?: string | null
                    size_shoes_eu?: string | null
                    category?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "products_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    items: Json
                    total_amount: number
                    status: string
                    created_at: string
                    updated_at: string
                    seller_id: string
                    shipping_address: string
                    buyer_name: string | null
                    buyer_phone: string | null
                    seller_net_amount: number
                    commission_amount: number
                    tracking_number: string | null
                    shipping_provider: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    items: Json
                    total_amount: number
                    status?: string
                    created_at?: string
                    updated_at?: string
                    seller_id: string
                    shipping_address: string
                    buyer_name?: string | null
                    buyer_phone?: string | null
                    seller_net_amount: number
                    commission_amount: number
                    tracking_number?: string | null
                    shipping_provider?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    items?: Json
                    total_amount?: number
                    status?: string
                    created_at?: string
                    updated_at?: string
                    seller_id?: string
                    shipping_address?: string
                    buyer_name?: string | null
                    buyer_phone?: string | null
                    seller_net_amount?: number
                    commission_amount?: number
                    tracking_number?: string | null
                    shipping_provider?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    federation_code: string | null
                    id_photo_url: string | null
                    updated_at: string | null
                    is_premium: boolean | null
                    handicap: number | null
                    email: string | null
                    phone: string | null
                    total_rounds: number | null
                    average_score: number | null
                    putts_avg: number | null
                    fairways_hit_rate: number | null
                    best_score: number | null
                    address: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    federation_code?: string | null
                    id_photo_url?: string | null
                    updated_at?: string | null
                    is_premium?: boolean | null
                    handicap?: number | null
                    email?: string | null
                    phone?: string | null
                    total_rounds?: number | null
                    average_score?: number | null
                    putts_avg?: number | null
                    fairways_hit_rate?: number | null
                    best_score?: number | null
                    address?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    federation_code?: string | null
                    id_photo_url?: string | null
                    updated_at?: string | null
                    is_premium?: boolean | null
                    handicap?: number | null
                    email?: string | null
                    phone?: string | null
                    total_rounds?: number | null
                    average_score?: number | null
                    putts_avg?: number | null
                    fairways_hit_rate?: number | null
                    best_score?: number | null
                    address?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            offers: {
                Row: {
                    id: string
                    product_id: string
                    buyer_id: string
                    seller_id: string
                    offer_amount: number
                    message: string | null
                    status: 'pending' | 'accepted' | 'rejected' | 'countered'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    buyer_id: string
                    seller_id: string
                    offer_amount: number
                    message?: string | null
                    status?: 'pending' | 'accepted' | 'rejected' | 'countered'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    buyer_id?: string
                    seller_id?: string
                    offer_amount?: number
                    message?: string | null
                    status?: 'pending' | 'accepted' | 'rejected' | 'countered'
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "offers_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "offers_buyer_id_fkey"
                        columns: ["buyer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "offers_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
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

type PublicSchema = Database["public"]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] & { Tables: any; Views: any })["Tables" | "Views"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] & { Tables: any; Views: any })["Tables" | "Views"][TableName] extends {
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
    ? keyof (Database[PublicTableNameOrOptions["schema"]] & { Tables: any })["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] & { Tables: any })["Tables"][TableName] extends {
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
    ? keyof (Database[PublicTableNameOrOptions["schema"]] & { Tables: any })["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] & { Tables: any })["Tables"][TableName] extends {
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
    ? keyof (Database[PublicEnumNameOrOptions["schema"]] & { Enums: any })["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicEnumNameOrOptions["schema"]] & { Enums: any })["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
