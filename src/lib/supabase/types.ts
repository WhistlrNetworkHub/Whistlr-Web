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
      users: {
        Row: {
          id: string
          name: string
          username: string
          email: string | null
          bio: string | null
          website: string | null
          location: string | null
          photoURL: string
          coverPhotoURL: string | null
          verified: boolean
          following: string[]
          followers: string[]
          theme: string | null
          accent: string | null
          totalTweets: number
          totalPhotos: number
          pinnedTweet: string | null
          createdAt: string
          updatedAt: string | null
        }
        Insert: {
          id: string
          name: string
          username: string
          email?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          photoURL: string
          coverPhotoURL?: string | null
          verified?: boolean
          following?: string[]
          followers?: string[]
          theme?: string | null
          accent?: string | null
          totalTweets?: number
          totalPhotos?: number
          pinnedTweet?: string | null
          createdAt?: string
          updatedAt?: string | null
        }
        Update: {
          id?: string
          name?: string
          username?: string
          email?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          photoURL?: string
          coverPhotoURL?: string | null
          verified?: boolean
          following?: string[]
          followers?: string[]
          theme?: string | null
          accent?: string | null
          totalTweets?: number
          totalPhotos?: number
          pinnedTweet?: string | null
          createdAt?: string
          updatedAt?: string | null
        }
      }
      tweets: {
        Row: {
          id: string
          text: string
          images: Json | null
          parent: { id: string; username: string } | null
          userLikes: string[]
          userReplies: number
          userRetweets: string[]
          createdBy: string
          createdAt: string
          updatedAt: string | null
        }
        Insert: {
          id: string
          text: string
          images?: Json | null
          parent?: { id: string; username: string } | null
          userLikes?: string[]
          userReplies?: number
          userRetweets?: string[]
          createdBy: string
          createdAt?: string
          updatedAt?: string | null
        }
        Update: {
          id?: string
          text?: string
          images?: Json | null
          parent?: { id: string; username: string } | null
          userLikes?: string[]
          userReplies?: number
          userRetweets?: string[]
          createdBy?: string
          createdAt?: string
          updatedAt?: string | null
        }
      }
      user_stats: {
        Row: {
          id: string
          userId: string
          likes: string[]
          tweets: string[]
          updatedAt: string | null
        }
        Insert: {
          id?: string
          userId: string
          likes?: string[]
          tweets?: string[]
          updatedAt?: string | null
        }
        Update: {
          id?: string
          userId?: string
          likes?: string[]
          tweets?: string[]
          updatedAt?: string | null
        }
      }
      bookmarks: {
        Row: {
          id: string
          userId: string
          tweetId: string
          createdAt: string
        }
        Insert: {
          id?: string
          userId: string
          tweetId: string
          createdAt?: string
        }
        Update: {
          id?: string
          userId?: string
          tweetId?: string
          createdAt?: string
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

