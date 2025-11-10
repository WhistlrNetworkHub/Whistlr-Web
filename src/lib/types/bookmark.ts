/**
 * Bookmark Type - Matches actual Supabase post_saves table schema
 */

export type Bookmark = {
  id: string;
  post_id: string | null;
  user_id: string | null;
  created_at: string;
};
