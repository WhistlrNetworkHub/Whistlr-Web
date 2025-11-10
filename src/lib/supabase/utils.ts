/**
 * Supabase Utility Functions
 * Replaces Firebase utilities with Supabase equivalents
 * Based on Vite and iOS patterns
 */

import { supabase } from './client';
import type { User } from '@lib/types/user';

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  return !data && !error;
}

/**
 * Get collection count
 */
export async function getCollectionCount(
  table: string,
  column?: string,
  value?: any
): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });

  if (column && value !== undefined) {
    query = query.eq(column, value);
  }

  const { count, error } = await query;

  if (error) {
    console.error(`Error getting count from ${table}:`, error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Update user data
 */
export async function updateUserData(
  userId: string,
  data: Partial<User>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

/**
 * Update user theme (stored in profile)
 */
export async function updateUserTheme(
  userId: string,
  updates: { theme?: 'light' | 'dim' | 'dark'; accent?: string }
): Promise<void> {
  const data: Record<string, any> = {};
  
  // Map 'dim' to 'dark' for database compatibility
  if (updates.theme) {
    data.theme_preference = updates.theme === 'dim' ? 'dark' : updates.theme;
  }
  
  // Accent is stored client-side only, not in database
  // Skip accent updates to database
  
  if (Object.keys(data).length > 0) {
    await updateUserData(userId, data);
  }
}

/**
 * Update username
 */
export async function updateUsername(
  userId: string,
  username: string
): Promise<void> {
  const isAvailable = await checkUsernameAvailability(username);

  if (!isAvailable) {
    throw new Error('Username is already taken');
  }

  await updateUserData(userId, { username });
}

/**
 * Manage pinned post
 */
export async function managePinnedPost(
  userId: string,
  postId: string,
  pin: boolean
): Promise<void> {
  if (pin) {
    // Unpin all other posts first
    await supabase
      .from('posts')
      .update({ is_pinned: false })
      .eq('author_id', userId);

    // Pin this post
    await supabase
      .from('posts')
      .update({ is_pinned: true })
      .eq('id', postId);
  } else {
    // Unpin this post
    await supabase
      .from('posts')
      .update({ is_pinned: false })
      .eq('id', postId);
  }
}

/**
 * Manage follow relationship
 */
export async function manageFollow(
  action: 'follow' | 'unfollow',
  userId: string,
  targetUserId: string
): Promise<void> {
  if (action === 'follow') {
    const { error } = await supabase.from('follows').insert({
      follower_id: userId,
      following_id: targetUserId
    });

    if (error) throw error;

    // Increment counts
    await Promise.all([
      supabase.rpc('increment', {
        table_name: 'profiles',
        row_id: userId,
        column_name: 'following_count'
      }),
      supabase.rpc('increment', {
        table_name: 'profiles',
        row_id: targetUserId,
        column_name: 'followers_count'
      })
    ]);
  } else {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);

    if (error) throw error;

    // Decrement counts
    await Promise.all([
      supabase.rpc('decrement', {
        table_name: 'profiles',
        row_id: userId,
        column_name: 'following_count'
      }),
      supabase.rpc('decrement', {
        table_name: 'profiles',
        row_id: targetUserId,
        column_name: 'followers_count'
      })
    ]);
  }
}

/**
 * Remove post
 */
export async function removeTweet(postId: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * Upload images to Supabase Storage
 */
export async function uploadImages(
  userId: string,
  images: File[]
): Promise<string[] | null> {
  if (!images || images.length === 0) return null;

  const uploadedUrls: string[] = [];

  for (const image of images) {
    const fileExt = image.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('post-media')
      .upload(fileName, image);

    if (error) {
      console.error('Error uploading image:', error);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    uploadedUrls.push(urlData.publicUrl);
  }

  return uploadedUrls.length > 0 ? uploadedUrls : null;
}

/**
 * Manage reply count
 */
export async function manageReply(
  action: 'increment' | 'decrement',
  postId: string
): Promise<void> {
  const { data: post } = await supabase
    .from('posts')
    .select('comments_count')
    .eq('id', postId)
    .single();

  if (post) {
    const newCount = action === 'increment' 
      ? (post.comments_count ?? 0) + 1
      : Math.max(0, (post.comments_count ?? 0) - 1);

    await supabase
      .from('posts')
      .update({ comments_count: newCount })
      .eq('id', postId);
  }
}

/**
 * Manage total tweets count
 */
export async function manageTotalTweets(
  action: 'increment' | 'decrement',
  userId: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('posts_count')
    .eq('id', userId)
    .single();

  if (profile) {
    const newCount = action === 'increment'
      ? (profile.posts_count ?? 0) + 1
      : Math.max(0, (profile.posts_count ?? 0) - 1);

    await supabase
      .from('profiles')
      .update({ posts_count: newCount })
      .eq('id', userId);
  }
}

/**
 * Manage total photos count (not in schema, skip for now)
 */
export async function manageTotalPhotos(
  action: 'increment' | 'decrement',
  userId: string
): Promise<void> {
  // Photos count not in schema, could add custom field if needed
  console.log('manageTotalPhotos:', action, userId);
}

/**
 * Manage like on post
 */
export async function manageLike(
  action: 'like' | 'unlike',
  postId: string,
  userId: string
): Promise<void> {
  if (action === 'like') {
    // Add like
    const { error } = await supabase.from('likes').insert({
      user_id: userId,
      post_id: postId
    });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }

    // Increment count
    const { data: post } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ likes_count: (post.likes_count ?? 0) + 1 })
        .eq('id', postId);
    }
  } else {
    // Remove like
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;

    // Decrement count
    const { data: post } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ likes_count: Math.max(0, (post.likes_count ?? 0) - 1) })
        .eq('id', postId);
    }
  }
}

/**
 * Manage repost (uses reposts table)
 */
export async function manageRetweet(
  action: 'repost' | 'unrepost',
  postId: string,
  userId: string
): Promise<void> {
  if (action === 'repost') {
    // Add repost
    const { error } = await supabase.from('reposts').insert({
      user_id: userId,
      original_post_id: postId,
      repost_type: 'simple'
    });

    if (error && error.code !== '23505') {
      throw error;
    }

    // Increment count
    const { data: post } = await supabase
      .from('posts')
      .select('reposts_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ reposts_count: (post.reposts_count ?? 0) + 1 })
        .eq('id', postId);
    }
  } else {
    // Remove repost
    const { error } = await supabase
      .from('reposts')
      .delete()
      .eq('user_id', userId)
      .eq('original_post_id', postId);

    if (error) throw error;

    // Decrement count
    const { data: post } = await supabase
      .from('posts')
      .select('reposts_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ reposts_count: Math.max(0, (post.reposts_count ?? 0) - 1) })
        .eq('id', postId);
    }
  }
}

/**
 * Manage bookmark
 */
export async function manageBookmark(
  action: 'bookmark' | 'unbookmark',
  postId: string,
  userId: string
): Promise<void> {
  if (action === 'bookmark') {
    const { error } = await supabase.from('post_saves').insert({
      user_id: userId,
      post_id: postId
    });

    if (error && error.code !== '23505') {
      throw error;
    }

    // Increment saves count
    const { data: post } = await supabase
      .from('posts')
      .select('saves_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ saves_count: (post.saves_count ?? 0) + 1 })
        .eq('id', postId);
    }
  } else {
    const { error } = await supabase
      .from('post_saves')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;

    // Decrement saves count
    const { data: post } = await supabase
      .from('posts')
      .select('saves_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ saves_count: Math.max(0, (post.saves_count ?? 0) - 1) })
        .eq('id', postId);
    }
  }
}

/**
 * Clear all bookmarks for a user
 */
export async function clearAllBookmarks(userId: string): Promise<void> {
  const { error } = await supabase
    .from('post_saves')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing bookmarks:', error);
    throw error;
  }
}
