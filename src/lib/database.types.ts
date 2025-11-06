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
      teams: {
        Row: {
          id: string
          name: string
          player1_name: string
          player2_name: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          player1_name: string
          player2_name: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          player1_name?: string
          player2_name?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_teams: {
        Row: {
          id: string
          group_id: string
          team_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          team_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          team_id?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          category: string
          phase: string
          group_id: string | null
          team1_id: string
          team2_id: string
          team1_set1: number
          team1_set2: number
          team1_set3: number | null
          team2_set1: number
          team2_set2: number
          team2_set3: number | null
          winner_id: string | null
          match_date: string | null
          court_number: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          phase: string
          group_id?: string | null
          team1_id: string
          team2_id: string
          team1_set1?: number
          team1_set2?: number
          team1_set3?: number | null
          team2_set1?: number
          team2_set2?: number
          team2_set3?: number | null
          winner_id?: string | null
          match_date?: string | null
          court_number?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          phase?: string
          group_id?: string | null
          team1_id?: string
          team2_id?: string
          team1_set1?: number
          team1_set2?: number
          team1_set3?: number | null
          team2_set1?: number
          team2_set2?: number
          team2_set3?: number | null
          winner_id?: string | null
          match_date?: string | null
          court_number?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      standings: {
        Row: {
          id: string
          group_id: string
          team_id: string
          played: number
          won: number
          lost: number
          sets_won: number
          sets_lost: number
          games_won: number
          games_lost: number
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          team_id: string
          played?: number
          won?: number
          lost?: number
          sets_won?: number
          sets_lost?: number
          games_won?: number
          games_lost?: number
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          team_id?: string
          played?: number
          won?: number
          lost?: number
          sets_won?: number
          sets_lost?: number
          games_won?: number
          games_lost?: number
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          name: string
          start_date: string | null
          end_date: string | null
          location: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      prizes: {
        Row: {
          id: string
          tournament_id: string | null
          category: string
          position: string
          team_id: string | null
          prize_amount: number | null
          prize_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id?: string | null
          category: string
          position: string
          team_id?: string | null
          prize_amount?: number | null
          prize_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string | null
          category?: string
          position?: string
          team_id?: string | null
          prize_amount?: number | null
          prize_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          max_teams: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          max_teams?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          max_teams?: number | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
