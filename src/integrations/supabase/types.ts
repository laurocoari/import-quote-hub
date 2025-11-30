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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      product_images: {
        Row: {
          created_at: string | null
          id: string
          is_main: boolean | null
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          product_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          internal_code: string | null
          name: string
          owner_id: string
          reference_link: string | null
          status: string | null
          target_price_usd: number | null
          updated_at: string | null
          usage_notes: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          internal_code?: string | null
          name: string
          owner_id: string
          reference_link?: string | null
          status?: string | null
          target_price_usd?: number | null
          updated_at?: string | null
          usage_notes?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          internal_code?: string | null
          name?: string
          owner_id?: string
          reference_link?: string | null
          status?: string | null
          target_price_usd?: number | null
          updated_at?: string | null
          usage_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quote_cost_simulations: {
        Row: {
          created_at: string | null
          estimated_total_cost_brl: number | null
          estimated_total_cost_usd: number | null
          estimated_unit_cost_brl: number | null
          estimated_unit_cost_usd: number | null
          exchange_rate: number
          freight_usd: number | null
          id: string
          insurance_usd: number | null
          other_costs_usd: number | null
          quantity: number
          quote_id: string
          tax_rate_percent: number | null
        }
        Insert: {
          created_at?: string | null
          estimated_total_cost_brl?: number | null
          estimated_total_cost_usd?: number | null
          estimated_unit_cost_brl?: number | null
          estimated_unit_cost_usd?: number | null
          exchange_rate: number
          freight_usd?: number | null
          id?: string
          insurance_usd?: number | null
          other_costs_usd?: number | null
          quantity: number
          quote_id: string
          tax_rate_percent?: number | null
        }
        Update: {
          created_at?: string | null
          estimated_total_cost_brl?: number | null
          estimated_total_cost_usd?: number | null
          estimated_unit_cost_brl?: number | null
          estimated_unit_cost_usd?: number | null
          exchange_rate?: number
          freight_usd?: number | null
          id?: string
          insurance_usd?: number | null
          other_costs_usd?: number | null
          quantity?: number
          quote_id?: string
          tax_rate_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_cost_simulations_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          assigned_to_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          requested_by_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          requested_by_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          requested_by_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          available_stock: number | null
          certifications: string | null
          competitor_links: string | null
          created_at: string | null
          created_by_id: string
          factory_location: string | null
          factory_name: string
          id: string
          incoterm: string | null
          lead_time_days: number | null
          moq: number
          price_per_unit_usd: number
          quote_request_id: string
          remarks: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          available_stock?: number | null
          certifications?: string | null
          competitor_links?: string | null
          created_at?: string | null
          created_by_id: string
          factory_location?: string | null
          factory_name: string
          id?: string
          incoterm?: string | null
          lead_time_days?: number | null
          moq: number
          price_per_unit_usd: number
          quote_request_id: string
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          available_stock?: number | null
          certifications?: string | null
          competitor_links?: string | null
          created_at?: string | null
          created_by_id?: string
          factory_location?: string | null
          factory_name?: string
          id?: string
          incoterm?: string | null
          lead_time_days?: number | null
          moq?: number
          price_per_unit_usd?: number
          quote_request_id?: string
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_profile_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "importer" | "exporter"
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
    Enums: {
      app_role: ["importer", "exporter"],
    },
  },
} as const
