import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase/client';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Loading } from '@components/ui/loading';
import type { ReactElement, ReactNode } from 'react';

export default function News(): React.ReactElement {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      // TODO: Implement news/articles query when ready
      setLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <MainContainer>
      <SEO title='News / Whistlr' />
      <MainHeader title='News' className='flex items-center justify-between' />
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No news articles yet</p>
            <p className='mt-2 text-light-secondary dark:text-dark-secondary'>News articles will appear here</p>
          </div>
        )}
      </section>
    </MainContainer>
  );
}

News.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);


