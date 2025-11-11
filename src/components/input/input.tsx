import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import cn from 'clsx';
import { toast } from 'react-hot-toast';
import { supabase } from '@lib/supabase/client';
import { tweetsCollection, commentsCollection } from '@lib/supabase/collections';
import {
  manageReply,
  uploadImages,
  manageTotalTweets,
  manageTotalPhotos
} from '@lib/supabase/utils';
import { useAuth } from '@lib/context/auth-context';
import { sleep } from '@lib/utils';
import { getImagesData } from '@lib/validation';
import { UserAvatar } from '@components/user/user-avatar';
import { InputForm, fromTop } from './input-form';
import { ImagePreview } from './image-preview';
import { InputOptions } from './input-options';
import type { ReactNode, FormEvent, ChangeEvent, ClipboardEvent } from 'react';
import type { Variants } from 'framer-motion';
import type { User } from '@lib/types/user';
import type { FilesWithId, ImagesPreview } from '@lib/types/file';

type InputProps = {
  modal?: boolean;
  reply?: boolean;
  parent?: { id: string; username: string };
  disabled?: boolean;
  children?: ReactNode;
  replyModal?: boolean;
  closeModal?: () => void;
};

export const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 }
};

export function Input({
  modal,
  reply,
  parent,
  disabled,
  children,
  replyModal,
  closeModal
}: InputProps): JSX.Element {
  const [selectedImages, setSelectedImages] = useState<FilesWithId>([]);
  const [imagesPreview, setImagesPreview] = useState<ImagesPreview>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [visited, setVisited] = useState(false);

  const { user, isAdmin } = useAuth();

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const previewCount = imagesPreview.length;
  const isUploadingImages = !!previewCount;

  useEffect(
    () => {
      if (modal) inputRef.current?.focus();
      return cleanImage;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const sendTweet = async (): Promise<void> => {
    if (!user) return;

    inputRef.current?.blur();
    setLoading(true);

    const isReplying = reply ?? replyModal;
    const userId = user.id as string;

    try {
      const mediaUrls = await uploadImages(userId, selectedImages);

      // If this is a reply, create a comment instead of a post
      if (isReplying && parent) {
        const commentData = {
          post_id: parent.id,
          author_id: userId,
          content: inputValue.trim() || '',
          media_urls: mediaUrls,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newComment, error } = await supabase
          .from(commentsCollection)
          .insert(commentData)
          .select('id')
          .single();

        if (error) {
          console.error('Error creating comment:', error);
          toast.error('Failed to send reply');
          return;
        }

        // Increment reply count on parent post
        await manageReply('increment', parent.id);

        toast.success('Reply sent!');
      } else {
        // Create a regular post
        const postData = {
          author_id: userId,
          content: inputValue.trim() || null,
          media_urls: mediaUrls ? JSON.stringify(mediaUrls) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newPost, error } = await supabase
          .from(tweetsCollection)
          .insert(postData)
          .select('id')
          .single();

        if (error) {
          console.error('Error creating post:', error);
          toast.error('Failed to send tweet');
          return;
        }

        // Update user stats
        await Promise.all([
          manageTotalTweets('increment', userId),
          mediaUrls && manageTotalPhotos('increment', userId)
        ]);

        toast.success(
          () => (
            <span className='flex gap-2'>
              Your Tweet was sent
              <Link href={`/tweet/${newPost.id}`} className='custom-underline font-bold'>
                View
              </Link>
            </span>
          ),
          { duration: 6000 }
        );
      }

      // Clean up
      if (!modal && !replyModal) {
        discardTweet();
      }

      if (closeModal) closeModal();
    } catch (error) {
      console.error('Error sending tweet:', error);
      toast.error('Failed to send tweet');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (
    e: ChangeEvent<HTMLInputElement> | ClipboardEvent<HTMLTextAreaElement>
  ): void => {
    const isClipboardEvent = 'clipboardData' in e;

    if (isClipboardEvent) {
      const isPastingText = e.clipboardData.getData('text');
      if (isPastingText) return;
    }

    const files = isClipboardEvent ? e.clipboardData.files : e.target.files;

    const imagesData = getImagesData(files, previewCount);

    if (!imagesData) {
      toast.error('Please choose a GIF or photo up to 4');
      return;
    }

    const { imagesPreviewData, selectedImagesData } = imagesData;

    setImagesPreview([...imagesPreview, ...imagesPreviewData]);
    setSelectedImages([...selectedImages, ...selectedImagesData]);

    inputRef.current?.focus();
  };

  const removeImage = (targetId: string) => (): void => {
    setSelectedImages(selectedImages.filter(({ id }) => id !== targetId));
    setImagesPreview(imagesPreview.filter(({ id }) => id !== targetId));

    const { src } = imagesPreview.find(({ id }) => id === targetId) ?? {};

    if (src) URL.revokeObjectURL(src);
  };

  const cleanImage = (): void => {
    imagesPreview.forEach(({ src }) => URL.revokeObjectURL(src));

    setSelectedImages([]);
    setImagesPreview([]);
  };

  const discardTweet = (): void => {
    setInputValue('');
    setVisited(false);
    cleanImage();

    inputRef.current?.blur();
  };

  const handleChange = ({
    target: { value }
  }: ChangeEvent<HTMLTextAreaElement>): void => setInputValue(value);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void sendTweet();
  };

  const handleFocus = (): void => setVisited(!loading);

  const formId = 'tweet-form';

  const isValidTweet = !!inputValue.trim() || isUploadingImages;
  const isCharLimitExceeded = inputValue.length > 280;

  const sendTweetButton = (
    <Button
      type='submit'
      className='accent-tab bg-main-accent px-4 py-1.5 font-bold text-white
                 enabled:hover:bg-main-accent/90 enabled:active:bg-main-accent/75
                 disabled:brightness-75 disabled:cursor-not-allowed'
      form={formId}
      disabled={!isValidTweet || isCharLimitExceeded || loading}
    >
      Tweet
    </Button>
  );

  return (
    <div className={cn('flex flex-col', modal && 'w-full')}>
      {children}
      {reply && user && (
        <motion.div className='flex items-center gap-2 px-4 py-2' {...fromTop}>
          <p className='text-light-secondary dark:text-dark-secondary'>
            Replying to
          </p>
          <Link
            href={`/user/${parent?.username}`}
            className='custom-underline text-main-accent'
          >
            @{parent?.username}
          </Link>
        </motion.div>
      )}
      <div className='flex gap-2 px-4 pt-3 pb-2 mx-4 my-2 rounded-3xl glass-morphism-strong border border-white/10 shadow-xl'>
        <UserAvatar
          src={user?.avatar_url || ''}
          alt={user?.full_name || user?.username || 'User'}
          username={user?.username || ''}
        />
        <div className='flex min-w-0 flex-1 flex-col'>
          <form
            className='flex flex-col gap-2'
            id={formId}
            onSubmit={handleSubmit}
          >
            <InputForm
              modal={modal}
              reply={reply}
              formId={formId}
              visited={visited}
              loading={loading}
              inputRef={inputRef}
              inputValue={inputValue}
              isValidTweet={isValidTweet}
              isCharLimitExceeded={isCharLimitExceeded}
              replyModal={replyModal}
              sendTweetButton={sendTweetButton}
              handleFocus={handleFocus}
              handleChange={handleChange}
              handleImageUpload={handleImageUpload}
            >
              {isUploadingImages && (
                <ImagePreview
                  imagesPreview={imagesPreview}
                  previewCount={previewCount}
                  removeImage={removeImage}
                />
              )}
            </InputForm>
          </form>
          <AnimatePresence initial={false}>
            {(reply || replyModal || visited) && (
              <InputOptions
                reply={reply}
                modal={modal}
                inputValue={inputValue}
                isValidTweet={isValidTweet}
                isCharLimitExceeded={isCharLimitExceeded}
                replyModal={replyModal}
                sendTweetButton={sendTweetButton}
                handleImageUpload={handleImageUpload}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Button component
function Button({
  children,
  ...rest
}: {
  children: ReactNode;
  [key: string]: any;
}): JSX.Element {
  return <button {...rest}>{children}</button>;
}
