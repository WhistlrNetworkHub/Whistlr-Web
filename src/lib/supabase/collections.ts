/**
 * Supabase table references
 * These replace the old Firebase collection references
 * Matches actual database schema
 */

// Table names as constants for type safety
export const PROFILES_TABLE = 'profiles';
export const POSTS_TABLE = 'posts';
export const COMMENTS_TABLE = 'comments';
export const BOOKMARKS_TABLE = 'post_saves';
export const FOLLOWS_TABLE = 'follows';
export const LIKES_TABLE = 'likes';
export const REPOSTS_TABLE = 'reposts';
export const HASHTAGS_TABLE = 'hashtags';
export const POST_SIGNALS_TABLE = 'post_signals';

// For backwards compatibility with existing code
export const usersCollection = PROFILES_TABLE;
export const tweetsCollection = POSTS_TABLE;
export const userBookmarksCollection = BOOKMARKS_TABLE;
export const userStatsCollection = 'user_stats'; // Legacy - may not exist
export const commentsCollection = COMMENTS_TABLE;
export const bookmarksCollection = BOOKMARKS_TABLE;
export const likesCollection = LIKES_TABLE;
export const followsCollection = FOLLOWS_TABLE;
export const repostsCollection = REPOSTS_TABLE;
export const hashtagsCollection = HASHTAGS_TABLE;
