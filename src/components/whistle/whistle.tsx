import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import cn from 'clsx';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import { delayScroll } from '@lib/utils';
import { Modal } from '@components/modal/modal';
import { WhistleReplyModal } from '@components/modal/whistle-reply-modal';
import { ImagePreview } from '@components/input/image-preview';
import { UserAvatar } from '@components/user/user-avatar';
import { UserTooltip } from '@components/user/user-tooltip';
import { UserName } from '@components/user/user-name';
import { UserUsername } from '@components/user/user-username';
import { WhistleActions } from './whistle-actions';
import { WhistleStatus } from './whistle-status';
import { WhistleStats } from './whistle-stats';
import { WhistleDate } from './whistle-date';
import type { Variants } from 'framer-motion';
import type { Whistle } from '@lib/types/whistle';
import type { User } from '@lib/types/user';

export type WhistleProps = Whistle & {
  user?: User;
  modal?: boolean;
  pinned?: boolean;
  profile?: User | null;
  parentWhistle?: boolean;
};

export const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export function Whistle(whistleData: WhistleProps): JSX.Element {
  const {
    id: whistleId,
    content,
    media_urls,
    modal,
    pinned,
    profile,
    author_id,
    created_at,
    parentWhistle,
    comments_count,
    likes_count,
    reposts_count,
    user: whistleUser
  } = whistleData;

  const { user } = useAuth();
  const { open, openModal, closeModal } = useModal();

  const whistleLink = `/whistle/${whistleId}`;
  const userId = user?.id as string;
  const isOwner = userId === author_id;

  // Extract user data
  const userData = whistleUser || profile;
  const {
    id: ownerId,
    full_name,
    username,
    is_verified,
    avatar_url
  } = userData || {};

  // Handle images - media_urls is an array of strings
  let images: any = null;
  if (media_urls && Array.isArray(media_urls) && media_urls.length > 0) {
    // Transform to format expected by ImagePreview
    images = media_urls.map((url, index) => ({
      id: `${whistleId}-${index}`,
      src: url,
      alt: `Image ${index + 1}`
    }));
  }

  return (
    <motion.article
      {...(!modal ? { ...variants, layout: 'position' } : {})}
      animate={{
        ...variants.animate,
        ...(parentWhistle && { transition: { duration: 0.2 } })
      }}
    >
      <Modal
        className='flex items-start justify-center'
        modalClassName='glass-morphism-strong rounded-2xl max-w-xl w-full my-8 overflow-hidden'
        open={open}
        closeModal={closeModal}
      >
        <WhistleReplyModal whistle={whistleData} closeModal={closeModal} />
      </Modal>
      <Link
        href={whistleLink}
        scroll={false}
        className={cn(
          `accent-tab hover-card relative flex flex-col
           gap-y-4 px-4 py-3 outline-none duration-200`,
          parentWhistle
            ? 'mt-0.5 pt-2.5 pb-0'
            : 'border-b border-light-border dark:border-dark-border'
        )}
        draggable={false}
        onClick={delayScroll(200)}
      >
        <div className='grid grid-cols-[auto,1fr] gap-x-3 gap-y-1'>
          <AnimatePresence initial={false}>
            {modal ? null : pinned ? (
              <WhistleStatus type='pin'>
                <p className='text-sm font-bold'>Pinned Whistle</p>
              </WhistleStatus>
            ) : null}
          </AnimatePresence>
          <div className='flex flex-col items-center gap-2'>
            <UserTooltip avatar modal={modal} {...userData}>
              <UserAvatar
                src={avatar_url || ''}
                alt={full_name || username || 'User'}
                username={username || ''}
                isLink={modal ? true : false}
              />
            </UserTooltip>
            {parentWhistle && (
              <i className='hover-animation h-full w-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
            )}
          </div>
          <div className='flex min-w-0 flex-col'>
            <div className='flex justify-between gap-2 text-light-secondary dark:text-dark-secondary'>
              <div className='flex gap-1 truncate xs:overflow-visible xs:whitespace-normal'>
                <UserTooltip modal={modal} {...userData}>
                  <UserName
                    className='-mb-1'
                    name={full_name || username || 'User'}
                    username={username || ''}
                    verified={is_verified || false}
                  />
                </UserTooltip>
                <UserUsername username={username || ''} />
              </div>
              <WhistleDate createdAt={created_at} whistleLink={whistleLink} />
            </div>
            <div className='flex flex-col gap-2'>
              {content && <p className='whitespace-pre-wrap break-words'>{content}</p>}
              {images && Array.isArray(images) && images.length > 0 && (
                <ImagePreview
                  whistle
                  imagesPreview={images}
                  previewCount={images.length}
                />
              )}
            </div>
            {!modal && (
              <WhistleActions
                isOwner={isOwner}
                ownerId={author_id || ''}
                whistleId={whistleId}
                username={username || ''}
                userLikesId={likes_count}
                userRetweetsId={reposts_count}
                whistleLink={whistleLink}
                openModal={!parentWhistle ? openModal : undefined}
              />
            )}
          </div>
        </div>
      </Link>
      {modal && (
        <WhistleStats
          userId={userId}
          isOwner={isOwner}
          whistleId={whistleId}
          reply={false}
          userLikes={[]}
          userRetweets={[]}
          userReplies={comments_count || 0}
        />
      )}
    </motion.article>
  );
}

// Backward compatibility export
export { Whistle as Tweet };
export type { WhistleProps as TweetProps };
