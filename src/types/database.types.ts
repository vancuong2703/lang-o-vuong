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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      coin_ledger: {
        Row: {
          balance_after: number
          counterpart_id: string | null
          created_at: string
          delta: number
          id: number
          reason: string
          ref: Json | null
          user_id: string
        }
        Insert: {
          balance_after: number
          counterpart_id?: string | null
          created_at?: string
          delta: number
          id?: never
          reason: string
          ref?: Json | null
          user_id: string
        }
        Update: {
          balance_after?: number
          counterpart_id?: string | null
          created_at?: string
          delta?: number
          id?: never
          reason?: string
          ref?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_ledger_counterpart_id_fkey"
            columns: ["counterpart_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          grow_seconds: number
          item_id: string
          seed_price: number
          xp: number
        }
        Insert: {
          grow_seconds: number
          item_id: string
          seed_price: number
          xp: number
        }
        Update: {
          grow_seconds?: number
          item_id?: string
          seed_price?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "crops_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      game_config: {
        Row: {
          description: string | null
          key: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          value?: Json
        }
        Relationships: []
      }
      inventory: {
        Row: {
          item_id: string
          qty: number
          user_id: string
        }
        Insert: {
          item_id: string
          qty?: number
          user_id: string
        }
        Update: {
          item_id?: string
          qty?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          base_price: number
          category: string
          id: string
          name_en: string
          name_vi: string
          sellable: boolean
          sort_order: number
          unlock_level: number
        }
        Insert: {
          base_price: number
          category: string
          id: string
          name_en: string
          name_vi: string
          sellable?: boolean
          sort_order?: number
          unlock_level?: number
        }
        Update: {
          base_price?: number
          category?: string
          id?: string
          name_en?: string
          name_vi?: string
          sellable?: boolean
          sort_order?: number
          unlock_level?: number
        }
        Relationships: []
      }
      parcels: {
        Row: {
          chunk_x: number | null
          chunk_y: number | null
          fertility_level: number
          id: number
          is_home_slot: boolean
          owner_id: string | null
          priority_slot_id: number | null
          purchased_at: string | null
          updated_at: string
          x: number
          y: number
          zone: string
        }
        Insert: {
          chunk_x?: number | null
          chunk_y?: number | null
          fertility_level?: number
          id?: never
          is_home_slot?: boolean
          owner_id?: string | null
          priority_slot_id?: number | null
          purchased_at?: string | null
          updated_at?: string
          x: number
          y: number
          zone?: string
        }
        Update: {
          chunk_x?: number | null
          chunk_y?: number | null
          fertility_level?: number
          id?: never
          is_home_slot?: boolean
          owner_id?: string | null
          priority_slot_id?: number | null
          purchased_at?: string | null
          updated_at?: string
          x?: number
          y?: number
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_priority_slot_id_fkey"
            columns: ["priority_slot_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          crop_types_planted: string[]
          harvested_total: number
          user_id: string
        }
        Insert: {
          crop_types_planted?: string[]
          harvested_total?: number
          user_id: string
        }
        Update: {
          crop_types_planted?: string[]
          harvested_total?: number
          user_id?: string
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
      plots: {
        Row: {
          crop_item_id: string | null
          id: number
          lx: number
          ly: number
          owner_id: string
          parcel_id: number
          planted_at: string | null
          ready_at: string | null
        }
        Insert: {
          crop_item_id?: string | null
          id?: never
          lx: number
          ly: number
          owner_id: string
          parcel_id: number
          planted_at?: string | null
          ready_at?: string | null
        }
        Update: {
          crop_item_id?: string | null
          id?: never
          lx?: number
          ly?: number
          owner_id?: string
          parcel_id?: number
          planted_at?: string | null
          ready_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plots_crop_item_id_fkey"
            columns: ["crop_item_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "plots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string
          banned_at: string | null
          barn_level: number
          coins: number
          created_at: string
          farm_name: string
          home_parcel_id: number | null
          house_level: number
          id: string
          is_admin: boolean
          last_login_date: string | null
          last_seen_at: string
          level: number
          login_streak: number
          rl_count: number
          rl_window_start: string
          tool_level: number
          tutorial_step: number
          username: string
          week_start: string | null
          weekly_xp: number
          xp: number
        }
        Insert: {
          avatar_color?: string
          banned_at?: string | null
          barn_level?: number
          coins?: number
          created_at?: string
          farm_name: string
          home_parcel_id?: number | null
          house_level?: number
          id: string
          is_admin?: boolean
          last_login_date?: string | null
          last_seen_at?: string
          level?: number
          login_streak?: number
          rl_count?: number
          rl_window_start?: string
          tool_level?: number
          tutorial_step?: number
          username: string
          week_start?: string | null
          weekly_xp?: number
          xp?: number
        }
        Update: {
          avatar_color?: string
          banned_at?: string | null
          barn_level?: number
          coins?: number
          created_at?: string
          farm_name?: string
          home_parcel_id?: number | null
          house_level?: number
          id?: string
          is_admin?: boolean
          last_login_date?: string | null
          last_seen_at?: string
          level?: number
          login_streak?: number
          rl_count?: number
          rl_window_start?: string
          tool_level?: number
          tutorial_step?: number
          username?: string
          week_start?: string | null
          weekly_xp?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_parcel_fk"
            columns: ["home_parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_state: { Args: never; Returns: Json }
      harvest: { Args: { p_plot_ids: number[] }; Returns: Json }
      plant: {
        Args: { p_crop_id: string; p_plot_ids: number[] }
        Returns: Json
      }
      sell: { Args: { p_item_id: string; p_qty: number }; Returns: Json }
      server_now: { Args: never; Returns: string }
      start_game: {
        Args: { p_farm_name: string; p_username: string }
        Returns: Json
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
