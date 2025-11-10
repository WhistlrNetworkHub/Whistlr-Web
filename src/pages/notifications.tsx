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

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'repost';
  actor_id: string;
  post_id?: string;
  created_at: string;
  read: boolean;
  actor?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function Notifications(): JSX.Element {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:actor_id(*)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
      }
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification!', payload);
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return (
    <MainContainer>
      <SEO title='Notifications / Whistlr' />
      <MainHeader title='Notifications' className='flex items-center justify-between' />
      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No notifications yet</p>
            <p className='mt-2 text-light-secondary dark:text-dark-secondary'>
              When someone likes, comments, or follows you, you'll see it here
            </p>
          </div>
        ) : (
          <div className='divide-y divide-light-border dark:divide-dark-border'>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 transition hover:bg-light-primary/5 dark:hover:bg-dark-primary/5 ${
                  !notification.read ? 'bg-accent-blue/5' : ''
                }`}
              >
                <div className='flex items-center gap-3'>
                  <img
                    src={notification.actor?.avatar_url || '/default-avatar.png'}
                    alt={notification.actor?.full_name || 'User'}
                    className='h-10 w-10 rounded-full'
                  />
                  <div className='flex-1'>
                    <p className='text-sm'>
                      <span className='font-bold'>{notification.actor?.full_name}</span>
                      {notification.type === 'like' && ' liked your post'}
                      {notification.type === 'comment' && ' commented on your post'}
                      {notification.type === 'follow' && ' started following you'}
                      {notification.type === 'repost' && ' reposted your post'}
                    </p>
                    <p className='mt-1 text-xs text-light-secondary dark:text-dark-secondary'>
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MainContainer>
  );
}

Notifications.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);

