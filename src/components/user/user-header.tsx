import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@lib/context/user-context';
import { isPlural } from '@lib/utils';
import { supabase } from '@lib/supabase/client';
import { UserName } from './user-name';
import type { Variants } from 'framer-motion';

export const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export function UserHeader(): React.ReactElement {
  const {
    pathname,
    query: { id }
  } = useRouter();

  const { user, loading } = useUser();
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalTweets, setTotalTweets] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  const userId = user ? user.id : null;

  useEffect(() => {
    if (!userId) return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        // Get total posts count
        const { count: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userId);

        // Get posts with media (photos/videos)
        const { count: mediaCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userId)
          .not('media_urls', 'is', null);

        // Get total likes count
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        setTotalTweets(postsCount || 0);
        setTotalPhotos(mediaCount || 0);
        setTotalLikes(likesCount || 0);
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  const currentPage = pathname.split('/').pop() ?? '';

  const isInTweetPage = ['[id]', 'with_replies'].includes(currentPage);
  const isInFollowPage = ['following', 'followers'].includes(currentPage);

  return (
    <AnimatePresence mode='popLayout'>
      {loading || statsLoading ? (
        <motion.div
          className='-mb-1 inner:animate-pulse inner:rounded-lg 
                     inner:bg-light-secondary dark:inner:bg-dark-secondary'
          {...variants}
          key='loading'
        >
          <div className='mb-1 -mt-1 h-5 w-24' />
          <div className='h-4 w-12' />
        </motion.div>
      ) : !user ? (
        <motion.h2 className='text-xl font-bold' {...variants} key='not-found'>
          {isInFollowPage ? `@${id as string}` : 'User'}
        </motion.h2>
      ) : (
        <motion.div className='-mb-1 truncate' {...variants} key='found'>
          <UserName
            tag='h2'
            name={user.name}
            className='-mt-1 text-xl'
            iconClassName='w-6 h-6'
            verified={user.verified}
          />
          <p className='text-xs text-light-secondary dark:text-dark-secondary'>
            {isInFollowPage
              ? `@${user.username}`
              : isInTweetPage
              ? totalTweets
                ? `${totalTweets} ${`Whistle${isPlural(totalTweets)}`}`
                : 'No Whistle'
              : currentPage === 'media'
              ? totalPhotos
                ? `${totalPhotos} Photo${isPlural(totalPhotos)} & GIF${isPlural(
                    totalPhotos
                  )}`
                : 'No Photo & GIF'
              : totalLikes
              ? `${totalLikes} Like${isPlural(totalLikes)}`
              : 'No Like'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
