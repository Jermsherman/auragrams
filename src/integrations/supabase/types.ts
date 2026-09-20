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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artist_profiles: {
        Row: {
          artist_handle: string | null
          artist_name: string
          bio: string | null
          created_at: string
          id: string
          links: Json
          profile_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_handle?: string | null
          artist_name: string
          bio?: string | null
          created_at?: string
          id?: string
          links?: Json
          profile_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_handle?: string | null
          artist_name?: string
          bio?: string | null
          created_at?: string
          id?: string
          links?: Json
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_comments: {
        Row: {
          aura_id: string
          author_id: string
          body: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          aura_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          aura_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aura_comments_aura_id_fkey"
            columns: ["aura_id"]
            isOneToOne: false
            referencedRelation: "auras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aura_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aura_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_reactions: {
        Row: {
          anon_key: string | null
          aura_id: string
          created_at: string
          id: string
          profile_id: string | null
          reaction: string
        }
        Insert: {
          anon_key?: string | null
          aura_id: string
          created_at?: string
          id?: string
          profile_id?: string | null
          reaction?: string
        }
        Update: {
          anon_key?: string | null
          aura_id?: string
          created_at?: string
          id?: string
          profile_id?: string | null
          reaction?: string
        }
        Relationships: [
          {
            foreignKeyName: "aura_reactions_aura_id_fkey"
            columns: ["aura_id"]
            isOneToOne: false
            referencedRelation: "auras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aura_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aura_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auracles: {
        Row: {
          artist_profile_id: string | null
          aura_ids: Json
          created_at: string
          description: string | null
          id: string
          project_type: string | null
          public_artist_name: string | null
          public_handle: string | null
          title: string
          updated_at: string
          user_id: string
          visibility_mode: string
        }
        Insert: {
          artist_profile_id?: string | null
          aura_ids?: Json
          created_at?: string
          description?: string | null
          id?: string
          project_type?: string | null
          public_artist_name?: string | null
          public_handle?: string | null
          title: string
          updated_at?: string
          user_id: string
          visibility_mode?: string
        }
        Update: {
          artist_profile_id?: string | null
          aura_ids?: Json
          created_at?: string
          description?: string | null
          id?: string
          project_type?: string | null
          public_artist_name?: string | null
          public_handle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "auracles_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auracles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auracles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auralinks: {
        Row: {
          artist_name: string
          artist_profile_id: string | null
          created_at: string
          custom_links: Json
          description: string | null
          featured_aura_id: string | null
          id: string
          mode: string
          profile_image_url: string | null
          selected_aura_ids: Json
          seo_description: string | null
          seo_title: string | null
          slug: string
          social_links: Json
          social_preview_image: string | null
          streaming_links: Json
          theme: Json
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          artist_name?: string
          artist_profile_id?: string | null
          created_at?: string
          custom_links?: Json
          description?: string | null
          featured_aura_id?: string | null
          id?: string
          mode?: string
          profile_image_url?: string | null
          selected_aura_ids?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          social_links?: Json
          social_preview_image?: string | null
          streaming_links?: Json
          theme?: Json
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          artist_name?: string
          artist_profile_id?: string | null
          created_at?: string
          custom_links?: Json
          description?: string | null
          featured_aura_id?: string | null
          id?: string
          mode?: string
          profile_image_url?: string | null
          selected_aura_ids?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          social_links?: Json
          social_preview_image?: string | null
          streaming_links?: Json
          theme?: Json
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      auras: {
        Row: {
          artist_profile_id: string | null
          audio_duration_seconds: number | null
          audio_file_name: string | null
          audio_mime_type: string | null
          audio_public_url: string | null
          audio_size_bytes: number | null
          audio_storage_path: string | null
          aura_description: string | null
          aura_name: string | null
          color_palette: Json | null
          created_at: string
          detected_key: string | null
          embed_url: string | null
          energy_level: number | null
          extra: Json
          id: string
          insight: Json | null
          is_anonymous: boolean | null
          mood_tags: Json
          palette_name: string | null
          pitch_center: string | null
          platform_name: string | null
          platform_url: string | null
          public_artist_name: string | null
          public_handle: string | null
          source_type: string | null
          status: string
          track_title: string
          updated_at: string
          user_id: string
          vibe_description: string | null
          visibility_mode: string
          visual_style: Json | null
        }
        Insert: {
          artist_profile_id?: string | null
          audio_duration_seconds?: number | null
          audio_file_name?: string | null
          audio_mime_type?: string | null
          audio_public_url?: string | null
          audio_size_bytes?: number | null
          audio_storage_path?: string | null
          aura_description?: string | null
          aura_name?: string | null
          color_palette?: Json | null
          created_at?: string
          detected_key?: string | null
          embed_url?: string | null
          energy_level?: number | null
          extra?: Json
          id?: string
          insight?: Json | null
          is_anonymous?: boolean | null
          mood_tags?: Json
          palette_name?: string | null
          pitch_center?: string | null
          platform_name?: string | null
          platform_url?: string | null
          public_artist_name?: string | null
          public_handle?: string | null
          source_type?: string | null
          status?: string
          track_title: string
          updated_at?: string
          user_id: string
          vibe_description?: string | null
          visibility_mode?: string
          visual_style?: Json | null
        }
        Update: {
          artist_profile_id?: string | null
          audio_duration_seconds?: number | null
          audio_file_name?: string | null
          audio_mime_type?: string | null
          audio_public_url?: string | null
          audio_size_bytes?: number | null
          audio_storage_path?: string | null
          aura_description?: string | null
          aura_name?: string | null
          color_palette?: Json | null
          created_at?: string
          detected_key?: string | null
          embed_url?: string | null
          energy_level?: number | null
          extra?: Json
          id?: string
          insight?: Json | null
          is_anonymous?: boolean | null
          mood_tags?: Json
          palette_name?: string | null
          pitch_center?: string | null
          platform_name?: string | null
          platform_url?: string | null
          public_artist_name?: string | null
          public_handle?: string | null
          source_type?: string | null
          status?: string
          track_title?: string
          updated_at?: string
          user_id?: string
          vibe_description?: string | null
          visibility_mode?: string
          visual_style?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "auras_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          page_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          page_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "auralinks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_anonymous: boolean
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          default_visibility: string
          display_name: string | null
          id: string
          onboarded_at: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          allow_anonymous?: boolean
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          default_visibility?: string
          display_name?: string | null
          id?: string
          onboarded_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          allow_anonymous?: boolean
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          default_visibility?: string
          display_name?: string | null
          id?: string
          onboarded_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_profile_id: { Args: never; Returns: string }
      get_shareable_auras: { Args: { _ids: string[] }; Returns: Json }
      is_username_available: { Args: { _username: string }; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
