import type { Theme, Accent } from './theme';

export type User = {
  id: string;
  username: string;
  full_name: string;
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
  created_at: string;
  updated_at: string;
  // Client-side only fields for theme
  theme?: Theme | null;
  accent?: Accent | null;
};

export type EditableData = Extract<
  keyof User,
  'bio' | 'full_name' | 'website' | 'avatar_url' | 'location'
>;

export type EditableUserData = Pick<User, EditableData>;
