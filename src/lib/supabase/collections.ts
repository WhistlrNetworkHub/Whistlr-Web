/**
 * Supabase table references
 * These replace the old Firebase collection references
 */

// Table names as constants for type safety
export const PROFILES_TABLE = 'profiles';
export const POSTS_TABLE = 'posts';
export const COMMENTS_TABLE = 'comments';
export const BOOKMARKS_TABLE = 'bookmarks';
export const FOLLOWS_TABLE = 'follows';
export const WHISTLES_TABLE = 'whistles';
export const POST_SIGNALS_TABLE = 'post_signals';
export const USER_STATS_TABLE = 'user_stats';

// For backwards compatibility with existing code
export const usersCollection = PROFILES_TABLE;
export const tweetsCollection = POSTS_TABLE;
export const userStatsCollection = USER_STATS_TABLE;

