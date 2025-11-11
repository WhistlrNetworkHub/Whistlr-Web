import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Popover } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import cn from 'clsx';
import { toast } from 'react-hot-toast';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import {
  removeTweet,
  manageReply,
  manageLike,
  manageRetweet,
  manageBookmark
} from '@lib/supabase/utils';
import { supabase } from '@lib/supabase/client';
import { Modal } from '@components/modal/modal';
import { ActionModal } from '@components/modal/action-modal';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import type { Variants } from 'framer-motion';

const variants: Variants = {
  initial: { opacity: 0, y: -25 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.4 }
  },
  exit: { opacity: 0, y: -25, transition: { duration: 0.2 } }
};

type TweetActionsProps = {
  isOwner: boolean;
  ownerId: string;
  tweetId: string;
  username: string;
  userLikesId: number;
  userRetweetsId: number;
  tweetLink: string;
  openModal?: () => void;
};

export function TweetActions({
  isOwner,
  ownerId,
  tweetId,
  username,
  userLikesId,
  userRetweetsId,
  tweetLink,
  openModal
}: TweetActionsProps): JSX.Element {
  const { user } = useAuth();
  const { open, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { back } = useRouter();

  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const userId = user?.id as string;

  // Check if user has liked/reposted/bookmarked this post
  useEffect(() => {
    if (!userId) return;

    const checkStatus = async () => {
      // Check liked
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', tweetId)
        .maybeSingle();
      setLiked(!!likeData);

      // Check reposted
      const { data: repostData } = await supabase
        .from('post_boosts')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', tweetId)
        .maybeSingle();
      setReposted(!!repostData);

      // Check bookmarked
      const { data: bookmarkData } = await supabase
        .from('post_saves')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', tweetId)
        .maybeSingle();
      setBookmarked(!!bookmarkData);
    };

    checkStatus();
  }, [userId, tweetId]);

  const handleLike = async (): Promise<void> => {
    if (!userId) return;

    // Optimistic update
    setLiked(!liked);

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', tweetId);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ user_id: userId, post_id: tweetId });
      }
    } catch (error) {
      // Revert on error
      setLiked(liked);
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleRepost = async (): Promise<void> => {
    if (!userId) return;

    // Optimistic update
    setReposted(!reposted);

    try {
      if (reposted) {
        // Un-repost
        await supabase
          .from('post_boosts')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', tweetId);
      } else {
        // Repost
        await supabase
          .from('post_boosts')
          .insert({ user_id: userId, post_id: tweetId });
      }
    } catch (error) {
      // Revert on error
      setReposted(reposted);
      console.error('Error toggling boost:', error);
      toast.error('Failed to update boost');
    }
  };

  const handleBookmark = async (): Promise<void> => {
    if (!userId) return;

    // Optimistic update
    setBookmarked(!bookmarked);

    try {
      if (bookmarked) {
        // Remove bookmark
        await supabase
          .from('post_saves')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', tweetId);
        
        toast.success('Removed from bookmarks');
      } else {
        // Add bookmark
        await supabase
          .from('post_saves')
          .insert({ user_id: userId, post_id: tweetId });
        
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      // Revert on error
      setBookmarked(bookmarked);
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };


  const handleDelete = async (): Promise<void> => {
    try {
      await removeTweet(tweetId);
      await manageReply('decrement', tweetId);
      closeDeleteModal();
      back();
      toast.success('Tweet deleted');
    } catch (error) {
      console.error('Error deleting tweet:', error);
      toast.error('Failed to delete tweet');
    }
  };

  return (
    <>
      <Modal
        modalClassName='max-w-xs glass-morphism-strong w-full p-8 rounded-2xl'
        open={open}
        closeModal={closeDeleteModal}
      >
        <ActionModal
          title='Delete Tweet?'
          description="This can't be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from search results."
          mainBtnClassName='bg-accent-red hover:bg-accent-red/90 active:bg-accent-red/75'
          mainBtnLabel='Delete'
          action={handleDelete}
          closeModal={closeDeleteModal}
        />
      </Modal>
      <div
        className={cn(
          'flex text-light-secondary inner:outline-none dark:text-dark-secondary',
          openModal && 'mt-2'
        )}
      >
        {openModal && (
          <Button
            className='hover-animation group relative flex items-center gap-1 p-0
                     outline-none transition-none hover:text-accent-blue focus-visible:text-accent-blue'
            onClick={openModal}
          >
            <i className='relative rounded-full p-2 not-italic group-hover:bg-accent-blue/10 
                         group-focus-visible:bg-accent-blue/10 group-focus-visible:ring-2 
                         group-focus-visible:ring-accent-blue/80 group-active:bg-accent-blue/20'>
              <HeroIcon className='h-5 w-5' iconName='ChatBubbleOvalLeftIcon' />
            </i>
            <p className='text-xs'>{userLikesId || 0}</p>
            <ToolTip tip='Reply' />
          </Button>
        )}
        <Button
          className={cn(
            'hover-animation group relative flex items-center gap-1 p-0 outline-none transition-none',
            reposted
              ? 'text-accent-green [&>i>svg]:[stroke-width:2px]'
              : 'hover:text-accent-green focus-visible:text-accent-green'
          )}
          onClick={handleRepost}
        >
          <i className='relative rounded-full p-2 not-italic group-hover:bg-accent-green/10 
                       group-focus-visible:bg-accent-green/10 group-focus-visible:ring-2 
                       group-focus-visible:ring-accent-green/80 group-active:bg-accent-green/20'>
            <HeroIcon className='h-5 w-5' iconName='ArrowPathRoundedSquareIcon' />
          </i>
          <p className='text-xs'>{userRetweetsId || 0}</p>
          <ToolTip tip={reposted ? 'Undo Boost' : 'Boost'} />
        </Button>
        <Button
          className={cn(
            'hover-animation group relative flex items-center gap-1 p-0 outline-none transition-none',
            liked
              ? 'text-accent-pink [&>i>svg]:fill-accent-pink [&>i>svg]:[stroke-width:2px]'
              : 'hover:text-accent-pink focus-visible:text-accent-pink'
          )}
          onClick={handleLike}
        >
          <i className='relative rounded-full p-2 not-italic group-hover:bg-accent-pink/10 
                       group-focus-visible:bg-accent-pink/10 group-focus-visible:ring-2 
                       group-focus-visible:ring-accent-pink/80 group-active:bg-accent-pink/20'>
            <HeroIcon className='h-5 w-5' iconName='HeartIcon' />
          </i>
          <p className='text-xs'>{userLikesId || 0}</p>
          <ToolTip tip={liked ? 'Unlike' : 'Like'} />
        </Button>
        <Popover className='relative'>
          {({ open: shareOpen, close }): JSX.Element => (
            <>
              <Popover.Button
                className='hover-animation group relative flex items-center gap-1 p-0 outline-none 
                         transition-none hover:text-accent-blue focus-visible:text-accent-blue'
              >
                <i className='relative rounded-full p-2 not-italic group-hover:bg-accent-blue/10 
                             group-focus-visible:bg-accent-blue/10 group-focus-visible:ring-2 
                             group-focus-visible:ring-accent-blue/80 group-active:bg-accent-blue/20'>
                  <HeroIcon className='h-5 w-5' iconName='ArrowUpTrayIcon' />
                </i>
                <ToolTip tip='Share' />
              </Popover.Button>
              <AnimatePresence>
                {shareOpen && (
                  <Popover.Panel
                    className='menu-container absolute right-0 top-11 w-[200px] font-medium'
                    as={motion.div}
                    {...variants}
                    static
                  >
                    <Popover.Button
                      className='flex w-full gap-3 rounded-md rounded-b-none p-4 
                               hover:bg-main-sidebar-background'
                      onClick={handleBookmark}
                    >
                      <HeroIcon
                        className='h-5 w-5'
                        iconName={bookmarked ? 'BookmarkSlashIcon' : 'BookmarkIcon'}
                        solid={bookmarked}
                      />
                      {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    </Popover.Button>
                    {isOwner && (
                      <Popover.Button
                        className='flex w-full gap-3 rounded-md rounded-t-none p-4 text-accent-red
                                 hover:bg-main-sidebar-background'
                        onClick={openDeleteModal}
                      >
                        <HeroIcon className='h-5 w-5' iconName='TrashIcon' />
                        Delete
                      </Popover.Button>
                    )}
                  </Popover.Panel>
                )}
              </AnimatePresence>
            </>
          )}
        </Popover>
      </div>
    </>
  );
}
