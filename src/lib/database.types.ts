export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          pickleball_level: string | null;
          city: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          pickleball_level?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          pickleball_level?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          creator_id: string;
          game_type: 'singles' | 'doubles';
          skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          max_players: number;
          current_players: number;
          venue_name: string;
          venue_address: string;
          city: string;
          scheduled_date: string;
          scheduled_time: string;
          duration_minutes: number | null;
          status: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          game_type: 'singles' | 'doubles';
          skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          max_players?: number;
          current_players?: number;
          venue_name: string;
          venue_address: string;
          city: string;
          scheduled_date: string;
          scheduled_time: string;
          duration_minutes?: number | null;
          status?: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          game_type?: 'singles' | 'doubles';
          skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          max_players?: number;
          current_players?: number;
          venue_name?: string;
          venue_address?: string;
          city?: string;
          scheduled_date?: string;
          scheduled_time?: string;
          duration_minutes?: number | null;
          status?: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_users: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          role: 'creator' | 'player';
          status: 'pending' | 'confirmed' | 'cancelled';
          team: 'A' | 'B' | null;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          role?: 'creator' | 'player';
          status?: 'pending' | 'confirmed' | 'cancelled';
          team?: 'A' | 'B' | null;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          role?: 'creator' | 'player';
          status?: 'pending' | 'confirmed' | 'cancelled';
          team?: 'A' | 'B' | null;
          joined_at?: string;
          updated_at?: string;
        };
      };
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
  }
} 