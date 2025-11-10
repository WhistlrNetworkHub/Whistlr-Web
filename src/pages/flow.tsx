import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase/client';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Loading } from '@components/ui/loading';
import type { ReactElement, ReactNode } from 'react';

export default function Flow(): JSX.Element {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      // TODO: Implement live streams query when streams table is ready
      setLoading(false);
    };

    fetchStreams();
  }, []);

  return (
    <MainContainer>
      <SEO title='Flow / Whistlr' />
      <MainHeader title='Flow' className='flex items-center justify-between' />
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No live streams</p>
            <p className='mt-2 text-light-secondary dark:text-dark-secondary'>Live streams will appear here</p>
          </div>
        )}
      </section>
    </MainContainer>
  );
}

Flow.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);


