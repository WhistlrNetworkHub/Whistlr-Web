import Link from 'next/link';
import { motion } from 'framer-motion';
import cn from 'clsx';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import { Modal } from '@components/modal/modal';
import { WhistleReplyModal } from '@components/modal/tweet-reply-modal';
import { ImagePreview } from '@components/input/image-preview';
import { UserAvatar } from '@components/user/user-avatar';
import { UserTooltip } from '@components/user/user-tooltip';
import { UserName } from '@components/user/user-name';
import { UserUsername } from '@components/user/user-username';
import { variants } from '@components/whistle/whistle';
import { WhistleActions } from '@components/whistle/whistle-actions';
import { WhistleStats } from '@components/whistle/whistle-stats';
import { WhistleDate } from '@components/whistle/whistle-date';
import { Input } from '@components/input/input';
import type { RefObject } from 'react';
import type { User } from '@lib/types/user';
import type { Tweet } from '@lib/types/whistle';

type ViewWhistleProps = Tweet & {
  user: User;
  viewWhistleRef?: RefObject<HTMLElement>;
};

export function ViewTweet(whistle: ViewWhistleProps): React.ReactElement {
  const {
    id: whistleId,
    text,
    images,
    parent,
    userLikes,
    createdBy,
    createdAt,
    userRetweets,
    userReplies,
    viewWhistleRef,
    user: whistleUserData
  } = tweet;

  const { id: ownerId, name, username, verified, photoURL } = whistleUserData;

  const { user } = useAuth();

  const { open, openModal, closeModal } = useModal();

  const whistleLink = `/whistle/${whistleId}`;

  const userId = user?.id as string;

  const isOwner = userId === createdBy;

  const reply = !!parent;

  const { id: parentId, username: parentUsername = username } = parent ?? {};

  return (
    <motion.article
      className={cn(
        `accent-tab h- relative flex cursor-default flex-col gap-3 border-b
         border-light-border px-4 py-3 outline-none dark:border-dark-border`,
        reply && 'scroll-m-[3.25rem] pt-0'
      )}
      {...variants}
      animate={{ ...variants.animate, transition: { duration: 0.2 } }}
      exit={undefined}
      ref={viewWhistleRef}
    >
      <Modal
        className='flex items-start justify-center'
        modalClassName='glass-morphism-strong rounded-2xl max-w-xl w-full mt-8 overflow-hidden'
        open={open}
        closeModal={closeModal}
      >
        <WhistleReplyModal whistle={tweet} closeModal={closeModal} />
      </Modal>
      <div className='flex flex-col gap-2'>
        {reply && (
          <div className='flex w-12 items-center justify-center'>
            <i className='hover-animation h-2 w-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
          </div>
        )}
        <div className='grid grid-cols-[auto,1fr] gap-3'>
          <UserTooltip avatar {...whistleUserData}>
            <UserAvatar src={photoURL} alt={name} username={username} />
          </UserTooltip>
          <div className='flex min-w-0 justify-between'>
            <div className='flex flex-col truncate xs:overflow-visible xs:whitespace-normal'>
              <UserTooltip {...whistleUserData}>
                <UserName
                  className='-mb-1'
                  name={name}
                  username={username}
                  verified={verified}
                />
              </UserTooltip>
              <UserTooltip {...whistleUserData}>
                <UserUsername username={username} />
              </UserTooltip>
            </div>
            <div className='px-4'>
              <WhistleActions
                viewWhistle
                isOwner={isOwner}
                ownerId={ownerId}
                whistleId={whistleId}
                parentId={parentId}
                username={username}
                hasImages={!!images}
                createdBy={createdBy}
              />
            </div>
          </div>
        </div>
      </div>
      {reply && (
        <p className='text-light-secondary dark:text-dark-secondary'>
          Replying to{' '}
          <Link href={`/user/${parentUsername}`}>
            <a className='custom-underline text-main-accent'>
              @{parentUsername}
            </a>
          </Link>
        </p>
      )}
      <div>
        {text && (
          <p className='whitespace-pre-line break-words text-2xl'>{text}</p>
        )}
        {images && (
          <ImagePreview
            viewWhistle
            imagesPreview={images}
            previewCount={images.length}
          />
        )}
        <div
          className='inner:hover-animation inner:border-b inner:border-light-border
                     dark:inner:border-dark-border'
        >
          <WhistleDate viewWhistle whistleLink={whistleLink} createdAt={createdAt} />
          <WhistleStats
            viewWhistle
            reply={reply}
            userId={userId}
            isOwner={isOwner}
            whistleId={whistleId}
            userLikes={userLikes}
            userRetweets={userRetweets}
            userReplies={userReplies}
            openModal={openModal}
          />
        </div>
        <Input reply parent={{ id: whistleId, username: username }} />
      </div>
    </motion.article>
  );
}
