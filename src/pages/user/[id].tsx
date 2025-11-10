import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@lib/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { useInfiniteScroll } from '@lib/hooks/useInfiniteScroll';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Tweet } from '@components/tweet/tweet';
import { Loading } from '@components/ui/loading';
import { Button } from '@components/ui/button';
import type { ReactElement, ReactNode } from 'react';

export default function UserProfile(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');

  const { data: posts, loading: postsLoading, LoadMore } = useInfiniteScroll(
    'posts',
    {
      filters: activeTab === 'posts' && id ? [{ column: 'author_id', operator: 'eq', value: id }] : [],
      orderBy: { column: 'created_at', ascending: false }
    },
    { includeUser: true, disabled: !id || activeTab !== 'posts' }
  );

  useEffect(() => {
    if (!id) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq(id.includes('@') ? 'username' : 'id', id)
        .single();

      if (!error && data) {
        setProfile(data);

        // Check if following
        if (currentUser && currentUser.id !== data.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', data.id)
            .single();

          setIsFollowing(!!followData);
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, [id, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: profile.id });
    }

    setIsFollowing(!isFollowing);
  };

  if (loading) return <Loading className='mt-20' />;
  if (!profile) return <div>User not found</div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <MainContainer>
      <SEO title={`${profile.full_name} (@${profile.username}) / Whistlr`} />
      <MainHeader title={profile.full_name} />

      {/* Profile Header */}
      <div className='border-b border-light-border dark:border-dark-border'>
        {profile.cover_url && (
          <div className='h-48 bg-light-secondary dark:bg-dark-secondary'>
            <img src={profile.cover_url} alt='Cover' className='h-full w-full object-cover' />
          </div>
        )}
        <div className='px-4 pb-4'>
          <div className='-mt-16 mb-4'>
            <img
              src={profile.avatar_url || '/default-avatar.png'}
              alt={profile.full_name}
              className='h-32 w-32 rounded-full border-4 border-main-background'
            />
          </div>
          <div className='flex items-start justify-between'>
            <div>
              <h2 className='text-xl font-bold'>{profile.full_name}</h2>
              <p className='text-light-secondary dark:text-dark-secondary'>@{profile.username}</p>
            </div>
            {!isOwnProfile && (
              <Button
                className={`${isFollowing ? 'bg-transparent border border-light-border' : 'bg-accent-blue'} px-4 py-2 font-bold text-white`}
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
          {profile.bio && <p className='mt-3'>{profile.bio}</p>}
          <div className='mt-3 flex gap-4 text-sm'>
            <span>
              <strong>{profile.following_count}</strong> <span className='text-light-secondary dark:text-dark-secondary'>Following</span>
            </span>
            <span>
              <strong>{profile.followers_count}</strong> <span className='text-light-secondary dark:text-dark-secondary'>Followers</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='border-b border-light-border dark:border-dark-border'>
        <div className='flex'>
          {['posts', 'likes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-4 py-3 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? 'border-b-4 border-accent-blue'
                  : 'text-light-secondary hover:bg-light-primary/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <section className='mt-0.5'>
        {postsLoading ? (
          <Loading className='mt-5' />
        ) : !posts || posts.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold'>No {activeTab} yet</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode='popLayout'>
              {posts.map((tweet) => (
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

UserProfile.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);


