import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@lib/supabase/client';
import { useUser } from '@lib/context/user-context';
import { UserLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { UserDataLayout } from '@components/layout/user-data-layout';
import { UserHomeLayout } from '@components/layout/user-home-layout';
import { Tweet } from '@components/tweet/tweet';
import { Loading } from '@components/ui/loading';
import { StatsEmpty } from '@components/tweet/stats-empty';
import type { ReactElement, ReactNode } from 'react';
import type { Tweet as TweetType } from '@lib/types/tweet';

export default function UserLikes(): JSX.Element {
  const { user } = useUser();
  const [likedPosts, setLikedPosts] = useState<TweetType[]>([]);
  const [loading, setLoading] = useState(true);

  const { id, full_name, username } = user ?? {};

  useEffect(() => {
    if (!id) return;

    const fetchLikes = async () => {
      try {
        // Fetch liked post IDs
        const { data: likes, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', id)
          .order('created_at', { ascending: false });

        if (likesError) throw likesError;

        if (!likes || likes.length === 0) {
          setLikedPosts([]);
          setLoading(false);
          return;
        }

        const postIds = likes.map((l) => l.post_id);

        // Fetch the actual posts with user data
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*, user:author_id(*)')
          .in('id', postIds);

        if (postsError) throw postsError;

        setLikedPosts(posts || []);
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [id]);

  return (
    <section>
      <SEO
        title={`Posts liked by ${full_name as string} (@${
          username as string
        }) / Whistlr`}
      />
      {loading ? (
        <Loading className='mt-5' />
      ) : likedPosts.length === 0 ? (
        <StatsEmpty
          title={`@${username as string} hasn't liked any posts`}
          description='When they do, those posts will show up here.'
        />
      ) : (
        <AnimatePresence mode='popLayout'>
          {likedPosts.map((tweet) => (
            <Tweet {...tweet} key={tweet.id} />
          ))}
        </AnimatePresence>
      )}
    </section>
  );
}

UserLikes.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <UserLayout>
        <UserDataLayout>
          <UserHomeLayout>{page}</UserHomeLayout>
        </UserDataLayout>
      </UserLayout>
    </MainLayout>
  </ProtectedLayout>
);
