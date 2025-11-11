/**
 * Whistle/Post Type - Matches actual Supabase posts table schema
 * Based on iOS and Vite implementations
 */

import type { User } from './user';

export type ImagePreview = {
  id: string;
  src: string;
  alt: string;
  type: string;
};

export type ImagesPreview = ImagePreview[];

// Main Whistle type matching Supabase schema
export type Whistle = {
  id: string;
  author_id: string | null;
  content: string | null;
  media_urls: any | null; // JSON type
  media_type: string | null;
  location: string | null;
  is_edited: boolean;
  is_pinned: boolean;
  visibility: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  reposts_count: number;
  created_at: string;
  updated_at: string;
  scheduled_for: string | null;
  deleted_at: string | null;
  upvotes_count: number;
  downvotes_count: number;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  caption: string | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  is_public: boolean;
};

// Whistle with author populated
export type WhistleWithUser = Whistle & {
  user?: User;
};

// Legacy compatibility type (for old Tweet references)
export type WhistleCompat = {
  id: string;
  text: string | null;
  images: any | null;
  parent: { id: string } | null;
  userLikes: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  userReplies: number;
  userRetweets: boolean;
  user?: User;
  pinned?: boolean;
  modal?: boolean;
  profile?: User;
  parentWhistle?: boolean;
};

// Type aliases for backward compatibility during migration
export type Whistle = Whistle;
export type WhistleWithUser = WhistleWithUser;
export type WhistleCompat = WhistleCompat;

 * Whistle/Post Type - Matches actual Supabase posts table schema
 * Based on iOS and Vite implementations
 */

import type { User } from './user';

export type ImagePreview = {
  id: string;
  src: string;
  alt: string;
  type: string;
};

export type ImagesPreview = ImagePreview[];

// Main Whistle type matching Supabase schema
export type Whistle = {
  id: string;
  author_id: string | null;
  content: string | null;
  media_urls: any | null; // JSON type
  media_type: string | null;
  location: string | null;
  is_edited: boolean;
  is_pinned: boolean;
  visibility: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  reposts_count: number;
  created_at: string;
  updated_at: string;
  scheduled_for: string | null;
  deleted_at: string | null;
  upvotes_count: number;
  downvotes_count: number;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  caption: string | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  is_public: boolean;
};

// Whistle with author populated
export type WhistleWithUser = Whistle & {
  user?: User;
};

// Legacy compatibility type (for old Tweet references)
export type WhistleCompat = {
  id: string;
  text: string | null;
  images: any | null;
  parent: { id: string } | null;
  userLikes: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  userReplies: number;
  userRetweets: boolean;
  user?: User;
  pinned?: boolean;
  modal?: boolean;
  profile?: User;
  parentWhistle?: boolean;
};

// Type aliases for backward compatibility during migration
export type Whistle = Whistle;
export type WhistleWithUser = WhistleWithUser;
export type WhistleCompat = WhistleCompat;



