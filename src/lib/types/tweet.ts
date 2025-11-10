import type { User } from './user';

export type ImagePreview = {
  id: string;
  src: string;
  alt: string;
  type: string;
};

export type ImagesPreview = ImagePreview[];

export type Tweet = {
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Computed fields from joins
  whistles_count?: number;
  comments_count?: number;
  boosts_count?: number;
  user_whistled?: boolean;
  user_boosted?: boolean;
};

export type TweetWithUser = Tweet & { user: User };
