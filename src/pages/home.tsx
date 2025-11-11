import { AnimatePresence } from 'framer-motion';
import { useWindow } from '@lib/context/window-context';
import { useInfiniteScroll } from '@lib/hooks/useInfiniteScroll';
import { whistlesCollection } from '@lib/supabase/collections';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Input } from '@components/input/input';
import { Whistle } from '@components/whistle/whistle';
import { Loading } from '@components/ui/loading';
import { Error } from '@components/ui/error';
import type { ReactElement, ReactNode } from 'react';

export default function Home(): React.ReactElement {
  const { isMobile } = useWindow();

  const { data, loading, LoadMore } = useInfiniteScroll(
    whistlesCollection,
    {
      orderBy: { column: 'created_at', ascending: false },
      filters: [{ column: 'media_type', operator: 'neq', value: 'video' }]
    },
    { includeUser: true, allowNull: true }
  );

  return (
    <MainContainer>
      <SEO title='Chattr / Whistlr' />
      <MainHeader
        useMobileSidebar
        title='Chattr'
        className='flex items-center justify-between'
      />
      <div className='pt-16'>
        {!isMobile && <Input />}
      </div>
      <section className='mt-0.5 xs:mt-0'>
        {loading ? (
          <Loading className='mt-5' />
        ) : !data ? (
          <Error message='Something went wrong' />
        ) : (
          <>
            <AnimatePresence mode='popLayout'>
              {data.map((whistle) => (
                <Whistle {...whistle} key={whistle.id} />
              ))}
            </AnimatePresence>
            <LoadMore />
          </>
        )}
      </section>
    </MainContainer>
  );
}

Home.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
