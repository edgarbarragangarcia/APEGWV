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
      achievements: {
        Row: {
          category: string | null
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          requirement_type: string | null
          requirement_value: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          name: string
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          selected_size: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          selected_size?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          selected_size?: string | null
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
      cities: {
        Row: {
          department_id: number | null
          id: number
          name: string
        }
        Insert: {
          department_id?: number | null
          id?: number
          name: string
        }
        Update: {
          department_id?: number | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_type: string
          id: string
          min_purchase_amount: number | null
          product_id: string | null
          seller_id: string
          usage_limit: number | null
          used_count: number | null
          valid_until: string | null
          value: number
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_type: string
          id?: string
          min_purchase_amount?: number | null
          product_id?: string | null
          seller_id: string
          usage_limit?: number | null
          used_count?: number | null
          valid_until?: string | null
          value: number
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_type?: string
          id?: string
          min_purchase_amount?: number | null
          product_id?: string | null
          seller_id?: string
          usage_limit?: number | null
          used_count?: number | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      course_blocked_days: {
        Row: {
          blocked_date: string
          course_id: string | null
          created_at: string | null
          end_time: string | null
          id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          blocked_date: string
          course_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          blocked_date?: string
          course_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
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
          created_at: string | null
          handicap: number | null
          hole_number: number
          id: string
          map_url: string | null
          par: number
          recorrido: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          handicap?: number | null
          hole_number: number
          id?: string
          map_url?: string | null
          par: number
          recorrido?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          handicap?: number | null
          hole_number?: number
          id?: string
          map_url?: string | null
          par?: number
          recorrido?: string | null
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
      departments: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_groups: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          id: string
          status: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          id?: string
          status?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          status?: string
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
          status?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          status?: string
          user_id?: string
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
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          buyer_id: string | null
          counter_amount: number | null
          counter_message: string | null
          created_at: string | null
          id: string
          message: string | null
          offer_amount: number
          product_id: string | null
          seller_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          counter_amount?: number | null
          counter_message?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          offer_amount: number
          product_id?: string | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          counter_amount?: number | null
          counter_message?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          offer_amount?: number
          product_id?: string | null
          seller_id?: string | null
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
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string | null
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
          buyer_id: string | null
          buyer_name: string | null
          buyer_phone: string | null
          commission_amount: number
          commission_fee: number | null
          created_at: string
          id: string
          items: Json | null
          order_number: string | null
          platform_fee: number | null
          product_id: string | null
          seller_id: string | null
          seller_net_amount: number | null
          seller_payout: number | null
          shipping_address: string | null
          shipping_provider: string | null
          status: string
          total_amount: number
          total_price: number | null
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_amount?: number
          commission_fee?: number | null
          created_at?: string
          id?: string
          items?: Json | null
          order_number?: string | null
          platform_fee?: number | null
          product_id?: string | null
          seller_id?: string | null
          seller_net_amount?: number | null
          seller_payout?: number | null
          shipping_address?: string | null
          shipping_provider?: string | null
          status?: string
          total_amount: number
          total_price?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_amount?: number
          commission_fee?: number | null
          created_at?: string
          id?: string
          items?: Json | null
          order_number?: string | null
          platform_fee?: number | null
          product_id?: string | null
          seller_id?: string | null
          seller_net_amount?: number | null
          seller_payout?: number | null
          shipping_address?: string | null
          shipping_provider?: string | null
          status?: string
          total_amount?: number
          total_price?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
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
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_holder: string
          card_type: string
          created_at: string | null
          encrypted_cvv: string | null
          encrypted_number: string | null
          expiry: string
          id: string
          is_default: boolean | null
          last_four: string
          user_id: string
        }
        Insert: {
          card_holder: string
          card_type: string
          created_at?: string | null
          encrypted_cvv?: string | null
          encrypted_number?: string | null
          expiry: string
          id?: string
          is_default?: boolean | null
          last_four: string
          user_id: string
        }
        Update: {
          card_holder?: string
          card_type?: string
          created_at?: string | null
          encrypted_cvv?: string | null
          encrypted_number?: string | null
          expiry?: string
          id?: string
          is_default?: boolean | null
          last_four?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          id: string
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          round_id: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          round_id?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          round_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      product_likes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          clothing_type: string | null
          condition: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_negotiable: boolean | null
          name: string
          negotiating_buyer_id: string | null
          negotiation_expires_at: string | null
          price: number
          seller_id: string | null
          shipping_cost: number | null
          size: string | null
          size_clothing: string | null
          size_shoes_cm: string | null
          size_shoes_col: string | null
          size_shoes_eu: string | null
          size_shoes_us: string | null
          sizes_inventory: Json | null
          status: string | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          clothing_type?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_negotiable?: boolean | null
          name: string
          negotiating_buyer_id?: string | null
          negotiation_expires_at?: string | null
          price: number
          seller_id?: string | null
          shipping_cost?: number | null
          size?: string | null
          size_clothing?: string | null
          size_shoes_cm?: string | null
          size_shoes_col?: string | null
          size_shoes_eu?: string | null
          size_shoes_us?: string | null
          sizes_inventory?: Json | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          clothing_type?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_negotiable?: boolean | null
          name?: string
          negotiating_buyer_id?: string | null
          negotiation_expires_at?: string | null
          price?: number
          seller_id?: string | null
          shipping_cost?: number | null
          size?: string | null
          size_clothing?: string | null
          size_shoes_cm?: string | null
          size_shoes_col?: string | null
          size_shoes_eu?: string | null
          size_shoes_us?: string | null
          sizes_inventory?: Json | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_negotiating_buyer_id_fkey"
            columns: ["negotiating_buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          average_score: number | null
          best_score: number | null
          city_id: number | null
          department_id: number | null
          email: string | null
          fairways_hit_rate: number | null
          federation_code: string | null
          full_name: string | null
          handicap: number | null
          has_completed_onboarding: boolean | null
          id: string
          id_photo_url: string | null
          is_admin: boolean | null
          is_premium: boolean | null
          phone: string | null
          putts_avg: number | null
          total_rounds: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          average_score?: number | null
          best_score?: number | null
          city_id?: number | null
          department_id?: number | null
          email?: string | null
          fairways_hit_rate?: number | null
          federation_code?: string | null
          full_name?: string | null
          handicap?: number | null
          has_completed_onboarding?: boolean | null
          id: string
          id_photo_url?: string | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          phone?: string | null
          putts_avg?: number | null
          total_rounds?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          average_score?: number | null
          best_score?: number | null
          city_id?: number | null
          department_id?: number | null
          email?: string | null
          fairways_hit_rate?: number | null
          federation_code?: string | null
          full_name?: string | null
          handicap?: number | null
          has_completed_onboarding?: boolean | null
          id?: string
          id_photo_url?: string | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          phone?: string | null
          putts_avg?: number | null
          total_rounds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          players_count: number | null
          price: number | null
          reservation_date: string
          status: string | null
          time: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          players_count?: number | null
          price?: number | null
          reservation_date: string
          status?: string | null
          time: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          players_count?: number | null
          price?: number | null
          reservation_date?: string
          status?: string | null
          time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          product_id: string | null
          rating: number | null
          reviewer_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      round_bets: {
        Row: {
          amount_per_point: number | null
          bet_type: string
          created_at: string
          creator_id: string
          id: string
          metadata: Json | null
          round_group_id: string
          status: string | null
        }
        Insert: {
          amount_per_point?: number | null
          bet_type: string
          created_at?: string
          creator_id: string
          id?: string
          metadata?: Json | null
          round_group_id: string
          status?: string | null
        }
        Update: {
          amount_per_point?: number | null
          bet_type?: string
          created_at?: string
          creator_id?: string
          id?: string
          metadata?: Json | null
          round_group_id?: string
          status?: string | null
        }
        Relationships: []
      }
      round_holes: {
        Row: {
          created_at: string | null
          fairway_hit: boolean | null
          gir: boolean | null
          hole_number: number
          id: string
          par: number
          putts: number | null
          round_id: string
          score: number
        }
        Insert: {
          created_at?: string | null
          fairway_hit?: boolean | null
          gir?: boolean | null
          hole_number: number
          id?: string
          par: number
          putts?: number | null
          round_id: string
          score: number
        }
        Update: {
          created_at?: string | null
          fairway_hit?: boolean | null
          gir?: boolean | null
          hole_number?: number
          id?: string
          par?: number
          putts?: number | null
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
          {
            foreignKeyName: "rounds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_group_members: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "saved_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_group_members_member_id_profiles_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_groups: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      swing_analyses: {
        Row: {
          analyzed_at: string
          feedback: Json | null
          id: string
          swing_score: number | null
          user_id: string
          video_url: string
        }
        Insert: {
          analyzed_at?: string
          feedback?: Json | null
          id?: string
          swing_score?: number | null
          user_id: string
          video_url: string
        }
        Update: {
          analyzed_at?: string
          feedback?: Json | null
          id?: string
          swing_score?: number | null
          user_id?: string
          video_url?: string
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
          address: string | null
          budget_items: Json | null
          budget_operational: number | null
          budget_per_player: number | null
          budget_prizes: number | null
          club: string
          created_at: string | null
          creator_id: string | null
          current_participants: number | null
          date: string
          description: string | null
          game_mode: string | null
          id: string
          image_url: string | null
          name: string
          participants_limit: number | null
          price: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          budget_items?: Json | null
          budget_operational?: number | null
          budget_per_player?: number | null
          budget_prizes?: number | null
          club: string
          created_at?: string | null
          creator_id?: string | null
          current_participants?: number | null
          date: string
          description?: string | null
          game_mode?: string | null
          id?: string
          image_url?: string | null
          name: string
          participants_limit?: number | null
          price: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          budget_items?: Json | null
          budget_operational?: number | null
          budget_per_player?: number | null
          budget_prizes?: number | null
          club?: string
          created_at?: string | null
          creator_id?: string | null
          current_participants?: number | null
          date?: string
          description?: string | null
          game_mode?: string | null
          id?: string
          image_url?: string | null
          name?: string
          participants_limit?: number | null
          price?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          awarded_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          awarded_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          awarded_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_clubs: {
        Row: {
          average_distance: number | null
          brand: string | null
          club_name: string
          created_at: string
          id: string
          is_active: boolean | null
          technical_specs: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_distance?: number | null
          brand?: string | null
          club_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          technical_specs?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_distance?: number | null
          brand?: string | null
          club_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          technical_specs?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          id: string
          item_name: string
          item_type: string
          last_interacted_at: string | null
          total_seconds: number | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          id?: string
          item_name: string
          item_type: string
          last_interacted_at?: string | null
          total_seconds?: number | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          id?: string
          item_name?: string
          item_type?: string
          last_interacted_at?: string | null
          total_seconds?: number | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_advanced_admin_stats: { Args: never; Returns: Json }
      get_all_orders: {
        Args: { page_num?: number; page_size?: number }
        Returns: {
          buyer_name: string
          created_at: string
          id: string
          items: Json
          status: string
          total_amount: number
        }[]
      }
      get_all_products: {
        Args: { page_num?: number; page_size?: number }
        Returns: {
          brand: string
          category: string
          id: string
          name: string
          price: number
          status: string
          stock_quantity: number
        }[]
      }
      get_all_profiles:
        | {
            Args: {
              page_num?: number
              page_size?: number
              search_query?: string
            }
            Returns: {
              email: string
              full_name: string
              handicap: number
              id: string
              is_premium: boolean
              phone: string
              updated_at: string
            }[]
          }
        | {
            Args: {
              page_num?: number
              page_size?: number
              search_query?: string
            }
            Returns: {
              avatar_url: string
              email: string
              full_name: string
              handicap: number
              id: string
              is_premium: boolean
              phone: string
              updated_at: string
            }[]
          }
      get_all_reservations: {
        Args: never
        Returns: {
          course_name: string
          id: string
          payment_status: string
          reservation_date: string
          reservation_time: string
          status: string
          user_email: string
          user_name: string
        }[]
      }
      get_all_tournaments: {
        Args: { page_num?: number; page_size?: number }
        Returns: {
          club: string
          current_participants: number
          date: string
          id: string
          name: string
          participants_limit: number
          price: number
          status: string
        }[]
      }
      get_available_courses: {
        Args: never
        Returns: {
          course_name: string
        }[]
      }
      get_user_details: { Args: { target_user_id: string }; Returns: Json }
      increment_interaction: {
        Args: {
          p_increment_view?: boolean
          p_item_name: string
          p_item_type: string
          p_seconds_to_add?: number
          p_user_id: string
        }
        Returns: undefined
      }
      is_group_member: { Args: { gid: string }; Returns: boolean }
      is_saved_group_member: { Args: { _group_id: string }; Returns: boolean }
      is_saved_group_owner: { Args: { _group_id: string }; Returns: boolean }
      reset_expired_negotiations: {
        Args: never
        Returns: {
          reset_count: number
        }[]
      }
      user_is_group_member: {
        Args: { group_uuid: string; user_uuid: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

