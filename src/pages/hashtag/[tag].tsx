import { useRouter } from 'next/router';
import { AnimatePresence } from 'framer-motion';
import { useInfiniteScroll } from '@lib/hooks/useInfiniteScroll';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Tweet } from '@components/tweet/tweet';
import { Loading } from '@components/ui/loading';
import { Error } from '@components/ui/error';
import type { ReactElement, ReactNode } from 'react';

export default function HashtagPage(): JSX.Element {
  const router = useRouter();
  const { tag } = router.query;

  const { data, loading, LoadMore } = useInfiniteScroll(
    'posts',
    {
      filters: tag ? [{ column: 'hashtags', operator: 'contains', value: `#${tag}` }] : [],
      orderBy: { column: 'created_at', ascending: false }
    },
    { includeUser: true, allowNull: true, disabled: !tag }
  );

  return (
    <MainContainer>
      <SEO title={`#${tag} / Whistlr`} />
      <MainHeader title={`#${tag}`} className='flex items-center justify-between' />
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : !data ? (
          <Error message='Something went wrong' />
        ) : data.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>
              No posts with #{tag}
            </p>
            <p className='mt-2 text-light-secondary dark:text-dark-secondary'>
              Be the first to post with this hashtag
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence mode='popLayout'>
              {data.map((tweet) => (
                <Tweet {...tweet} key={tweet.id} />
              ))}
            </AnimatePresence>
            <LoadMore />
          </>
        )}
      </section>
    </MainContainer>
  );
}

HashtagPage.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);


