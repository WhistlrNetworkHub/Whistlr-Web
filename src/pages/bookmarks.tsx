import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import { supabase } from '@lib/supabase/client';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Modal } from '@components/modal/modal';
import { ActionModal } from '@components/modal/action-modal';
import { Tweet } from '@components/tweet/tweet';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { Button } from '@components/ui/button';
import { ToolTip } from '@components/ui/tooltip';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import type { ReactElement, ReactNode } from 'react';
import type { Tweet as TweetType } from '@lib/types/tweet';

export default function Bookmarks(): JSX.Element {
  const { user } = useAuth();
  const { open, openModal, closeModal } = useModal();

  const [bookmarkedTweets, setBookmarkedTweets] = useState<TweetType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBookmarks = async () => {
      try {
        // Fetch bookmarked post IDs
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('post_saves')
          .select('post_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (bookmarksError) throw bookmarksError;

        if (!bookmarks || bookmarks.length === 0) {
          setBookmarkedTweets([]);
          setLoading(false);
          return;
        }

        const postIds = bookmarks.map((b) => b.post_id);

        // Fetch the actual posts with user data
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*, user:author_id(*)')
          .in('id', postIds);

        if (postsError) throw postsError;

        setBookmarkedTweets(posts || []);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        toast.error('Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user?.id]);

  const handleClear = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('post_saves')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setBookmarkedTweets([]);
      closeModal();
      toast.success('Successfully cleared all bookmarks');
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
      toast.error('Failed to clear bookmarks');
    }
  };

  return (
    <MainContainer>
      <SEO title='Bookmarks / Whistlr' />
      <Modal
        modalClassName='max-w-xs glass-morphism-strong w-full p-8 rounded-2xl'
        open={open}
        closeModal={closeModal}
      >
        <ActionModal
          title='Clear all Bookmarks?'
          description='This can’t be undone and you’ll remove all Tweets you’ve added to your Bookmarks.'
          mainBtnClassName='bg-accent-red hover:bg-accent-red/90 active:bg-accent-red/75 accent-tab 
                            focus-visible:bg-accent-red/90'
          mainBtnLabel='Clear'
          action={handleClear}
          closeModal={closeModal}
        />
      </Modal>
      <MainHeader className='flex items-center justify-between'>
        <div className='-mb-1 flex flex-col'>
          <h2 className='-mt-1 text-xl font-bold'>Bookmarks</h2>
          <p className='text-xs text-light-secondary dark:text-dark-secondary'>
            @{user?.username}
          </p>
        </div>
        <Button
          className='dark-bg-tab group relative p-2 hover:bg-light-primary/10
                     active:bg-light-primary/20 dark:hover:bg-dark-primary/10 
                     dark:active:bg-dark-primary/20'
          onClick={openModal}
        >
          <HeroIcon className='h-5 w-5' iconName='ArchiveBoxXMarkIcon' />
          <ToolTip
            className='!-translate-x-20 translate-y-3 md:-translate-x-1/2'
            tip='Clear bookmarks'
          />
        </Button>
      </MainHeader>
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : bookmarkedTweets.length === 0 ? (
          <StatsEmpty
            title='Save Tweets for later'
            description='Don't let the good ones fly away! Bookmark Tweets to easily find them again in the future.'
            imageData={{ src: '/assets/no-bookmarks.png', alt: 'No bookmarks' }}
          />
        ) : (
          <AnimatePresence mode='popLayout'>
            {bookmarkedTweets.map((tweet) => (
              <Tweet {...tweet} key={tweet.id} />
            ))}
          </AnimatePresence>
        )}
      </section>
    </MainContainer>
  );
}

Bookmarks.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
