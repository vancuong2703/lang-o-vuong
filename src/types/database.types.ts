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
      animal_types: {
        Row: {
          cycle_seconds: number
          feed_item_id: string
          id: string
          name_vi: string
          pen_type_id: string
          price: number
          product_item_id: string
          unlock_level: number
          xp: number
        }
        Insert: {
          cycle_seconds: number
          feed_item_id: string
          id: string
          name_vi: string
          pen_type_id: string
          price: number
          product_item_id: string
          unlock_level: number
          xp: number
        }
        Update: {
          cycle_seconds?: number
          feed_item_id?: string
          id?: string
          name_vi?: string
          pen_type_id?: string
          price?: number
          product_item_id?: string
          unlock_level?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "animal_types_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_types_pen_type_id_fkey"
            columns: ["pen_type_id"]
            isOneToOne: true
            referencedRelation: "structure_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_types_product_item_id_fkey"
            columns: ["product_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          animal_type_id: string
          created_at: string
          fed_at: string | null
          id: number
          owner_id: string
          ready_at: string | null
          structure_id: number
        }
        Insert: {
          animal_type_id: string
          created_at?: string
          fed_at?: string | null
          id?: never
          owner_id: string
          ready_at?: string | null
          structure_id: number
        }
        Update: {
          animal_type_id?: string
          created_at?: string
          fed_at?: string | null
          id?: never
          owner_id?: string
          ready_at?: string | null
          structure_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "animals_animal_type_id_fkey"
            columns: ["animal_type_id"]
            isOneToOne: false
            referencedRelation: "animal_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_ledger_counterpart_id_fkey"
            columns: ["counterpart_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_ledger_counterpart_id_fkey"
            columns: ["counterpart_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
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
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
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
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          id: number
          requirements: Json
          reward_coins: number
          reward_xp: number
          skipped_at: string | null
          slot: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: never
          requirements: Json
          reward_coins: number
          reward_xp: number
          skipped_at?: string | null
          slot: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: never
          requirements?: Json
          reward_coins?: number
          reward_xp?: number
          skipped_at?: string | null
          slot?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
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
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
          },
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
      player_quests: {
        Row: {
          claimed_at: string | null
          id: number
          progress: number
          quest_date: string
          reward_coins: number
          reward_xp: number
          target: number
          template_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          id?: never
          progress?: number
          quest_date: string
          reward_coins: number
          reward_xp: number
          target: number
          template_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          id?: never
          progress?: number
          quest_date?: string
          reward_coins?: number
          reward_xp?: number
          target?: number
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_quests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quest_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
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
      production_jobs: {
        Row: {
          collected_at: string | null
          id: number
          owner_id: string
          ready_at: string
          recipe_id: string
          start_at: string
          structure_id: number
        }
        Insert: {
          collected_at?: string | null
          id?: never
          owner_id: string
          ready_at: string
          recipe_id: string
          start_at: string
          structure_id: number
        }
        Update: {
          collected_at?: string | null
          id?: never
          owner_id?: string
          ready_at?: string
          recipe_id?: string
          start_at?: string
          structure_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
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
      quest_templates: {
        Row: {
          difficulty: number
          id: string
          min_level: number
          name_vi: string
          target_base: number
          target_per_level: number
          type: string
        }
        Insert: {
          difficulty: number
          id: string
          min_level?: number
          name_vi: string
          target_base: number
          target_per_level?: number
          type: string
        }
        Update: {
          difficulty?: number
          id?: string
          min_level?: number
          name_vi?: string
          target_base?: number
          target_per_level?: number
          type?: string
        }
        Relationships: []
      }
      recipe_inputs: {
        Row: {
          item_id: string
          qty: number
          recipe_id: string
        }
        Insert: {
          item_id: string
          qty: number
          recipe_id: string
        }
        Update: {
          item_id?: string
          qty?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_inputs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_inputs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          id: string
          output_item_id: string
          output_qty: number
          seconds: number
          sort_order: number
          structure_type_id: string
          unlock_level: number
          xp: number
        }
        Insert: {
          id: string
          output_item_id: string
          output_qty: number
          seconds: number
          sort_order?: number
          structure_type_id: string
          unlock_level: number
          xp: number
        }
        Update: {
          id?: string
          output_item_id?: string
          output_qty?: number
          seconds?: number
          sort_order?: number
          structure_type_id?: string
          unlock_level?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_output_item_id_fkey"
            columns: ["output_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_structure_type_id_fkey"
            columns: ["structure_type_id"]
            isOneToOne: false
            referencedRelation: "structure_types"
            referencedColumns: ["id"]
          },
        ]
      }
      structure_types: {
        Row: {
          build_price: number
          id: string
          kind: string
          max_per_player: number
          name_vi: string
          sort_order: number
          unlock_level: number
        }
        Insert: {
          build_price: number
          id: string
          kind: string
          max_per_player?: number
          name_vi: string
          sort_order?: number
          unlock_level: number
        }
        Update: {
          build_price?: number
          id?: string
          kind?: string
          max_per_player?: number
          name_vi?: string
          sort_order?: number
          unlock_level?: number
        }
        Relationships: []
      }
      structures: {
        Row: {
          created_at: string
          id: number
          level: number
          owner_id: string
          parcel_id: number
          quadrant: number
          type_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          level?: number
          owner_id: string
          parcel_id: number
          quadrant: number
          type_id: string
        }
        Update: {
          created_at?: string
          id?: never
          level?: number
          owner_id?: string
          parcel_id?: number
          quadrant?: number
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "structures_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_land"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structures_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structures_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_weekly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structures_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structures_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structures_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "structure_types"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_levels: {
        Row: {
          cost: number
          kind: string
          level: number
          required_player_level: number
          value: number
        }
        Insert: {
          cost: number
          kind: string
          level: number
          required_player_level?: number
          value: number
        }
        Update: {
          cost?: number
          kind?: string
          level?: number
          required_player_level?: number
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_land: {
        Row: {
          farm_name: string | null
          id: string | null
          level: number | null
          parcels: number | null
          username: string | null
        }
        Relationships: []
      }
      leaderboard_level: {
        Row: {
          farm_name: string | null
          id: string | null
          level: number | null
          username: string | null
          xp: number | null
        }
        Relationships: []
      }
      leaderboard_weekly: {
        Row: {
          farm_name: string | null
          id: string | null
          level: number | null
          username: string | null
          weekly_xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      build_structure: {
        Args: { p_parcel_id: number; p_quadrant: number; p_type_id: string }
        Returns: Json
      }
      buy_animal: { Args: { p_structure_id: number }; Returns: Json }
      buy_parcel: { Args: { p_parcel_id: number }; Returns: Json }
      claim_daily_login: { Args: never; Returns: Json }
      claim_quest: { Args: { p_quest_id: number }; Returns: Json }
      collect_animals: { Args: { p_structure_id: number }; Returns: Json }
      collect_production: { Args: { p_structure_id: number }; Returns: Json }
      feed_animals: { Args: { p_structure_id: number }; Returns: Json }
      fulfill_order: { Args: { p_order_id: number }; Returns: Json }
      get_daily_quests: { Args: never; Returns: Json }
      get_my_state: { Args: never; Returns: Json }
      get_orders: { Args: never; Returns: Json }
      get_world: { Args: never; Returns: Json }
      harvest: { Args: { p_plot_ids: number[] }; Returns: Json }
      plant: {
        Args: { p_crop_id: string; p_plot_ids: number[] }
        Returns: Json
      }
      sell: { Args: { p_item_id: string; p_qty: number }; Returns: Json }
      server_now: { Args: never; Returns: string }
      skip_order: { Args: { p_order_id: number }; Returns: Json }
      start_game: {
        Args: { p_farm_name: string; p_username: string }
        Returns: Json
      }
      start_production: {
        Args: { p_recipe_id: string; p_structure_id: number }
        Returns: Json
      }
      upgrade: { Args: { p_kind: string; p_target_id?: number }; Returns: Json }
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
