/**
 * Supabase Database Types
 * Generated from actual database schema
 * Matches iOS and Vite implementations
 */

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
          username: string | null
          full_name: string | null
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
          email_notifications: boolean
          push_notifications: boolean
          dark_mode: boolean
          language: string
          created_at: string
          updated_at: string
          display_name: string | null
          pronouns: string | null
          gender: string | null
          custom_gender: string | null
          birth_date: string | null
          cover_url: string | null
          category: string | null
          mood: string
          phone: string | null
          contact_options: string[]
          account_type: string
          show_similar_account_suggestions: boolean
          show_activity_status: boolean
          theme_preference: string
          email_address: string | null
          phone_number: string | null
          whatsapp_number: string | null
          telegram_username: string | null
          terms_accepted_at: string | null
          privacy_accepted_at: string | null
          legacy_uid: string | null
          secret_question: string | null
          secret_answer_hash: string | null
          has_secret_question: boolean
          failed_login_attempts: number
          account_locked_until: string | null
          last_login_at: string | null
          password_changed_at: string
          email: string | null
          deleted_at: string | null
          latitude: number | null
          longitude: number | null
          last_seen: string
          verification_badge_type: string | null
          verification_badge_color: string | null
          verification_badge_icon: string | null
        }
        Insert: {
          id?: string
          username?: string | null
          full_name?: string | null
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
          email_notifications?: boolean
          push_notifications?: boolean
          dark_mode?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
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
          email_notifications?: boolean
          push_notifications?: boolean
          dark_mode?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string | null
          content: string | null
          media_urls: Json | null
          media_type: string | null
          location: string | null
          is_edited: boolean
          is_pinned: boolean
          visibility: string
          likes_count: number
          comments_count: number
          shares_count: number
          saves_count: number
          reposts_count: number
          created_at: string
          updated_at: string
          scheduled_for: string | null
          deleted_at: string | null
          upvotes_count: number
          downvotes_count: number
          video_url: string | null
          thumbnail_url: string | null
          duration: number | null
          caption: string | null
          hashtags: string[] | null
          mentions: string[] | null
          is_public: boolean
        }
        Insert: {
          id?: string
          author_id?: string | null
          content?: string | null
          media_urls?: Json | null
          media_type?: string | null
          location?: string | null
          is_edited?: boolean
          is_pinned?: boolean
          visibility?: string
          likes_count?: number
          comments_count?: number
          shares_count?: number
          saves_count?: number
          reposts_count?: number
          created_at?: string
          updated_at?: string
          scheduled_for?: string | null
          deleted_at?: string | null
          upvotes_count?: number
          downvotes_count?: number
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          caption?: string | null
          hashtags?: string[] | null
          mentions?: string[] | null
          is_public?: boolean
        }
        Update: {
          id?: string
          author_id?: string | null
          content?: string | null
          media_urls?: Json | null
          media_type?: string | null
          location?: string | null
          is_edited?: boolean
          is_pinned?: boolean
          visibility?: string
          likes_count?: number
          comments_count?: number
          shares_count?: number
          saves_count?: number
          reposts_count?: number
          created_at?: string
          updated_at?: string
          scheduled_for?: string | null
          deleted_at?: string | null
          upvotes_count?: number
          downvotes_count?: number
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          caption?: string | null
          hashtags?: string[] | null
          mentions?: string[] | null
          is_public?: boolean
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string | null
          author_id: string | null
          parent_comment_id: string | null
          content: string
          is_edited: boolean
          likes_count: number
          replies_count: number
          created_at: string
          updated_at: string
          media_urls: string[] | null
          media_type: string | null
          gif_url: string | null
          gif_title: string | null
          mentions_count: number
          thread_depth: number
          comment_type: string
          upvotes_count: number
          downvotes_count: number
          mentions: string[] | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          author_id?: string | null
          parent_comment_id?: string | null
          content: string
          is_edited?: boolean
          likes_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
          media_urls?: string[] | null
          media_type?: string | null
          gif_url?: string | null
          gif_title?: string | null
          mentions_count?: number
          thread_depth?: number
          comment_type?: string
          upvotes_count?: number
          downvotes_count?: number
          mentions?: string[] | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          author_id?: string | null
          parent_comment_id?: string | null
          content?: string
          is_edited?: boolean
          likes_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
          media_urls?: string[] | null
          media_type?: string | null
          gif_url?: string | null
          gif_title?: string | null
          mentions_count?: number
          thread_depth?: number
          comment_type?: string
          upvotes_count?: number
          downvotes_count?: number
          mentions?: string[] | null
          deleted_at?: string | null
        }
      }
      likes: {
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
      post_saves: {
        Row: {
          id: string
          post_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string | null
          following_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          follower_id?: string | null
          following_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string | null
          following_id?: string | null
          created_at?: string
        }
      }
      reposts: {
        Row: {
          id: string
          user_id: string
          original_post_id: string
          quote_content: string | null
          quote_media_urls: string[] | null
          repost_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_post_id: string
          quote_content?: string | null
          quote_media_urls?: string[] | null
          repost_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_post_id?: string
          quote_content?: string | null
          quote_media_urls?: string[] | null
          repost_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      hashtags: {
        Row: {
          id: string
          tag: string
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tag: string
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tag?: string
          usage_count?: number
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

