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
          id: string
          username: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          website: string | null
          location: string | null
          followers_count: number
          following_count: number
          posts_count: number
          is_verified: boolean
          is_private: boolean
          is_online: boolean
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          is_verified?: boolean
          is_private?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          is_verified?: boolean
          is_private?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          caption: string | null
          media_url: string | null
          media_type: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          caption?: string | null
          media_url?: string | null
          media_type?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          caption?: string | null
          media_url?: string | null
          media_type?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      whistles: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      post_signals: {
        Row: {
          id: string
          post_id: string
          views: number
          whistles: number
          boosts: number
          quote_boosts: number
          comments: number
          saves: number
          shares: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          views?: number
          whistles?: number
          boosts?: number
          quote_boosts?: number
          comments?: number
          saves?: number
          shares?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          views?: number
          whistles?: number
          boosts?: number
          quote_boosts?: number
          comments?: number
          saves?: number
          shares?: number
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
