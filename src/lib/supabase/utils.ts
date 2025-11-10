import { supabase } from './client';
import type { EditableUserData } from '@lib/types/user';
import type { FilesWithId, ImagesPreview } from '@lib/types/file';
import type { Theme, Accent } from '@lib/types/theme';

export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .limit(1);
  
  return !data || data.length === 0;
}

export async function getCollectionCount(
  table: string,
  filter?: { column: string; value: any }
): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  
  const { count } = await query;
  return count || 0;
}

export async function updateUserData(
  userId: string,
  userData: EditableUserData
): Promise<void> {
  await supabase
    .from('users')
    .update({
      ...userData,
      updatedAt: new Date().toISOString()
    })
    .eq('id', userId);
}

export async function updateUserTheme(
  userId: string,
  themeData: { theme?: Theme; accent?: Accent }
): Promise<void> {
  await supabase
    .from('users')
    .update(themeData)
    .eq('id', userId);
}

export async function updateUsername(
  userId: string,
  username?: string
): Promise<void> {
  await supabase
    .from('users')
    .update({
      ...(username && { username }),
      updatedAt: new Date().toISOString()
    })
    .eq('id', userId);
}

export async function managePinnedTweet(
  type: 'pin' | 'unpin',
  userId: string,
  tweetId: string
): Promise<void> {
  await supabase
    .from('users')
    .update({
      updatedAt: new Date().toISOString(),
      pinnedTweet: type === 'pin' ? tweetId : null
    })
    .eq('id', userId);
}

export async function manageFollow(
  type: 'follow' | 'unfollow',
  userId: string,
  targetUserId: string
): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('following')
    .eq('id', userId)
    .single();

  const { data: targetUser } = await supabase
    .from('users')
    .select('followers')
    .eq('id', targetUserId)
    .single();

  if (!user || !targetUser) return;

  const following = user.following || [];
  const followers = targetUser.followers || [];

  if (type === 'follow') {
    await Promise.all([
      supabase
        .from('users')
        .update({
          following: [...following, targetUserId],
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId),
      supabase
        .from('users')
        .update({
          followers: [...followers, userId],
          updatedAt: new Date().toISOString()
        })
        .eq('id', targetUserId)
    ]);
  } else {
    await Promise.all([
      supabase
        .from('users')
        .update({
          following: following.filter((id) => id !== targetUserId),
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId),
      supabase
        .from('users')
        .update({
          followers: followers.filter((id) => id !== userId),
          updatedAt: new Date().toISOString()
        })
        .eq('id', targetUserId)
    ]);
  }
}

export async function removeTweet(tweetId: string): Promise<void> {
  await supabase.from('tweets').delete().eq('id', tweetId);
}

export async function uploadImages(
  userId: string,
  files: FilesWithId
): Promise<ImagesPreview | null> {
  if (!files.length) return null;

  const imagesPreview = await Promise.all(
    files.map(async (file) => {
      const { id, name: alt, type } = file;
      const filePath = `images/${userId}/${id}`;

      const { error: uploadError } = await supabase.storage
        .from('tweets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tweets')
        .getPublicUrl(filePath);

      return { id, src: publicUrl, alt, type };
    })
  );

  return imagesPreview;
}

export async function manageReply(
  type: 'increment' | 'decrement',
  tweetId: string
): Promise<void> {
  const { data: tweet } = await supabase
    .from('tweets')
    .select('userReplies')
    .eq('id', tweetId)
    .single();

  if (!tweet) return;

  await supabase
    .from('tweets')
    .update({
      userReplies: tweet.userReplies + (type === 'increment' ? 1 : -1),
      updatedAt: new Date().toISOString()
    })
    .eq('id', tweetId);
}

export async function manageTotalTweets(
  type: 'increment' | 'decrement',
  userId: string
): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('totalTweets')
    .eq('id', userId)
    .single();

  if (!user) return;

  await supabase
    .from('users')
    .update({
      totalTweets: user.totalTweets + (type === 'increment' ? 1 : -1),
      updatedAt: new Date().toISOString()
    })
    .eq('id', userId);
}

export async function manageTotalPhotos(
  type: 'increment' | 'decrement',
  userId: string
): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('totalPhotos')
    .eq('id', userId)
    .single();

  if (!user) return;

  await supabase
    .from('users')
    .update({
      totalPhotos: user.totalPhotos + (type === 'increment' ? 1 : -1),
      updatedAt: new Date().toISOString()
    })
    .eq('id', userId);
}

export function manageRetweet(
  type: 'retweet' | 'unretweet',
  userId: string,
  tweetId: string
) {
  return async (): Promise<void> => {
    const [{ data: tweet }, { data: stats }] = await Promise.all([
      supabase
        .from('tweets')
        .select('userRetweets')
        .eq('id', tweetId)
        .single(),
      supabase
        .from('user_stats')
        .select('tweets')
        .eq('userId', userId)
        .single()
    ]);

    if (!tweet || !stats) return;

    const userRetweets = tweet.userRetweets || [];
    const tweets = stats.tweets || [];

    if (type === 'retweet') {
      await Promise.all([
        supabase
          .from('tweets')
          .update({
            userRetweets: [...userRetweets, userId],
            updatedAt: new Date().toISOString()
          })
          .eq('id', tweetId),
        supabase
          .from('user_stats')
          .update({
            tweets: [...tweets, tweetId],
            updatedAt: new Date().toISOString()
          })
          .eq('userId', userId)
      ]);
    } else {
      await Promise.all([
        supabase
          .from('tweets')
          .update({
            userRetweets: userRetweets.filter((id) => id !== userId),
            updatedAt: new Date().toISOString()
          })
          .eq('id', tweetId),
        supabase
          .from('user_stats')
          .update({
            tweets: tweets.filter((id) => id !== tweetId),
            updatedAt: new Date().toISOString()
          })
          .eq('userId', userId)
      ]);
    }
  };
}

export function manageLike(
  type: 'like' | 'unlike',
  userId: string,
  tweetId: string
) {
  return async (): Promise<void> => {
    const [{ data: tweet }, { data: stats }] = await Promise.all([
      supabase
        .from('tweets')
        .select('userLikes')
        .eq('id', tweetId)
        .single(),
      supabase
        .from('user_stats')
        .select('likes')
        .eq('userId', userId)
        .single()
    ]);

    if (!tweet || !stats) return;

    const userLikes = tweet.userLikes || [];
    const likes = stats.likes || [];

    if (type === 'like') {
      await Promise.all([
        supabase
          .from('tweets')
          .update({
            userLikes: [...userLikes, userId],
            updatedAt: new Date().toISOString()
          })
          .eq('id', tweetId),
        supabase
          .from('user_stats')
          .update({
            likes: [...likes, tweetId],
            updatedAt: new Date().toISOString()
          })
          .eq('userId', userId)
      ]);
    } else {
      await Promise.all([
        supabase
          .from('tweets')
          .update({
            userLikes: userLikes.filter((id) => id !== userId),
            updatedAt: new Date().toISOString()
          })
          .eq('id', tweetId),
        supabase
          .from('user_stats')
          .update({
            likes: likes.filter((id) => id !== tweetId),
            updatedAt: new Date().toISOString()
          })
          .eq('userId', userId)
      ]);
    }
  };
}

export async function manageBookmark(
  type: 'bookmark' | 'unbookmark',
  userId: string,
  tweetId: string
): Promise<void> {
  if (type === 'bookmark') {
    await supabase.from('bookmarks').insert({
      userId,
      tweetId,
      createdAt: new Date().toISOString()
    });
  } else {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('userId', userId)
      .eq('tweetId', tweetId);
  }
}

export async function clearAllBookmarks(userId: string): Promise<void> {
  await supabase.from('bookmarks').delete().eq('userId', userId);
}

