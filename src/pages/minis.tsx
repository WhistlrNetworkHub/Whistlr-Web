import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase/client';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Loading } from '@components/ui/loading';
import { Error } from '@components/ui/error';
import type { ReactElement, ReactNode } from 'react';

export default function Minis(): JSX.Element {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMinis = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:author_id(*)')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching minis:', error);
      } else {
        setVideos(data || []);
      }
      setLoading(false);
    };

    fetchMinis();
  }, []);

  return (
    <MainContainer>
      <SEO title='Minis / Whistlr' />
      <MainHeader title='Minis' className='flex items-center justify-between' />
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : videos.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No minis yet</p>
            <p className='mt-2 text-light-secondary dark:text-dark-secondary'>Video content will appear here</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-2 p-4 md:grid-cols-3'>
            {videos.map((video) => (
              <div key={video.id} className='aspect-[9/16] rounded-lg bg-light-secondary/20 dark:bg-dark-secondary/20'>
                {/* Video player will go here */}
                <div className='flex h-full items-center justify-center'>
                  <p className='text-sm text-light-secondary dark:text-dark-secondary'>Mini Video</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MainContainer>
  );
}

Minis.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);

