import { useRef } from 'react';
import { useRouter } from 'next/router';
import { AnimatePresence } from 'framer-motion';
import { useDocument } from '@lib/hooks/useDocument';
import { useCollection } from '@lib/hooks/useCollection';
import { isPlural } from '@lib/utils';
import { tweetsCollection, commentsCollection } from '@lib/supabase/collections';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Error } from '@components/ui/error';
import { Loading } from '@components/ui/loading';
import { Tweet } from '@components/tweet/tweet';
import { Input } from '@components/input/input';
import type { ReactElement, ReactNode } from 'react';

export default function TweetId(): JSX.Element {
  const {
    query: { id },
    back
  } = useRouter();

  const { data: tweetData, loading: tweetLoading } = useDocument(
    tweetsCollection,
    id as string,
    { includeUser: true, allowNull: true }
  );

  const viewTweetRef = useRef<HTMLElement>(null);

  // Fetch comments for this post
  const { data: commentsData, loading: commentsLoading } = useCollection(
    commentsCollection,
    {
      filter: { column: 'post_id', value: id },
      orderBy: { column: 'created_at', ascending: false },
      includeUser: true,
      allowNull: true
    }
  );

  const { content, media_urls } = tweetData ?? {};

  // Parse media_urls
  let images: any = null;
  if (media_urls) {
    try {
      images = typeof media_urls === 'string' ? JSON.parse(media_urls) : media_urls;
    } catch {
      images = media_urls;
    }
  }

  const imagesLength = Array.isArray(images) ? images.length : 0;

  const pageTitle = tweetData
    ? `${tweetData.user?.full_name || tweetData.user?.username || 'User'} on Whistlr: "${
        content ?? ''
      }" ${
        imagesLength > 1
          ? `(${imagesLength} image${isPlural(imagesLength)})`
          : ''
      }`
    : null;

  return (
    <MainContainer>
      <SEO
        title={pageTitle ?? 'Tweet / Whistlr'}
        description={content ?? undefined}
        image={imagesLength === 1 && images ? images[0] : undefined}
      />
      <MainHeader useActionButton title='Tweet' action={back} />
      <section>
        {tweetLoading ? (
          <Loading className='mt-5' />
        ) : !tweetData ? (
          <>
            <Error message='Tweet not found' />
            {commentsData && (
              <p className='m-4 text-center text-sm text-light-secondary dark:text-dark-secondary'>
                But you can see other replies
              </p>
            )}
          </>
        ) : (
          <>
            <Tweet {...tweetData} modal />
            <Input reply parent={{ id: id as string, username: tweetData.user?.username || '' }} />
          </>
        )}
        {!tweetLoading && tweetData && (
          <section className='mt-0.5' ref={viewTweetRef}>
            {commentsLoading ? (
              <Loading className='mt-5' />
            ) : commentsData && commentsData.length > 0 ? (
              <AnimatePresence mode='popLayout'>
                {commentsData.map((comment) => (
                  <Tweet {...comment} key={comment.id} modal />
                ))}
              </AnimatePresence>
            ) : (
              <p className='m-4 text-center text-sm text-light-secondary dark:text-dark-secondary'>
                No replies yet
              </p>
            )}
          </section>
        )}
      </section>
    </MainContainer>
  );
}

TweetId.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
