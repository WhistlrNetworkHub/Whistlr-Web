import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Loading } from '@components/ui/loading';
import type { ReactElement, ReactNode } from 'react';

export default function Inbox(): JSX.Element {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      // TODO: Implement messages table query
      setLoading(false);
    };

    fetchMessages();
  }, [user]);

  return (
    <MainContainer>
      <SEO title='Inbox / Whistlr' />
      <MainHeader title='Inbox' className='flex items-center justify-between' />
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No messages yet</p>
            <p className='mt-2 text-light-secondary dark:text-dark-secondary'>Your messages will appear here</p>
          </div>
        )}
      </section>
    </MainContainer>
  );
}

Inbox.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);

