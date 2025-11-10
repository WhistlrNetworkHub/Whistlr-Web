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

export default function Discover(): JSX.Element {
  const { data, loading, LoadMore } = useInfiniteScroll(
    'posts',
    {
      orderBy: { column: 'likes_count', ascending: false }
    },
    { includeUser: true, allowNull: true }
  );

  return (
    <MainContainer>
      <SEO title='Discover / Whistlr' />
      <MainHeader title='Discover' className='flex items-center justify-between' />
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : !data ? (
          <Error message='Something went wrong' />
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

Discover.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);

