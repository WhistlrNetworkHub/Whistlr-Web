/**
 * User Type - Matches actual Supabase profiles table schema
 * Based on iOS and Vite implementations
 */

export type User = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_verified: boolean;
  is_private: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  email_notifications: boolean;
  push_notifications: boolean;
  dark_mode: boolean;
  language: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  pronouns: string | null;
  gender: string | null;
  custom_gender: string | null;
  birth_date: string | null;
  cover_url: string | null;
  category: string | null;
  mood: string;
  phone: string | null;
  contact_options: string[];
  account_type: string;
  show_similar_account_suggestions: boolean;
  show_activity_status: boolean;
  theme_preference: string;
  email_address: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  telegram_username: string | null;
  verification_badge_type: string | null;
  verification_badge_color: string | null;
  verification_badge_icon: string | null;
};

// Legacy compatibility - map old field names to new
export type UserCompat = User & {
  name: string | null; // maps to full_name
  photoURL: string | null; // maps to avatar_url
  verified: boolean; // maps to is_verified
  coverPhotoURL: string | null; // maps to cover_url
};

export type EditableData = Extract<
  keyof User,
  'bio' | 'full_name' | 'website' | 'avatar_url' | 'location' | 'cover_url'
>;

export type EditableUserData = Pick<User, EditableData>;
