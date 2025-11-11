import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { HeroIcon } from '@components/ui/hero-icon';
import type { ReactElement, ReactNode } from 'react';

export default function UserProfile(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts');

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
      const { data, error} = await supabase
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
            .maybeSingle();

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
      
      // Update follower count
      await supabase
        .from('profiles')
        .update({ followers_count: (profile.followers_count || 1) - 1 })
        .eq('id', profile.id);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: profile.id });
      
      // Update follower count
      await supabase
        .from('profiles')
        .update({ followers_count: (profile.followers_count || 0) + 1 })
        .eq('id', profile.id);
    }

    setIsFollowing(!isFollowing);
    setProfile({ ...profile, followers_count: isFollowing ? profile.followers_count - 1 : profile.followers_count + 1 });
  };

  if (loading) return <Loading className='mt-20' />;
  if (!profile) return <div className='text-center mt-20 text-white'>User not found</div>;

  const isOwnProfile = currentUser?.id === profile.id;
  const coverUrl = profile.cover_url || profile.avatar_url || '/default-avatar.png';
  const avatarUrl = profile.avatar_url || '/default-avatar.png';

  return (
    <MainContainer>
      <SEO title={`${profile.full_name || profile.username} (@${profile.username}) / Whistlr`} />
      <MainHeader 
        useActionButton
        title={profile.full_name || profile.username} 
        className='glass-morphism-strong border-b border-white/5'
      />

      {/* iOS-Style Profile Header with Cover Banner */}
      <div className='relative'>
        {/* Cover Photo Banner */}
        <div className='relative h-[450px] mx-4 mt-4 rounded-3xl overflow-hidden'>
          {/* Cover Image */}
          <img
            src={coverUrl}
            alt={`${profile.username} cover`}
            className='w-full h-full object-cover'
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.png';
            }}
          />

          {/* Gradient Overlay */}
          <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80' />

          {/* Top Overlay - Username & Follow Button */}
          <div className='absolute top-0 left-0 right-0 p-5 flex items-start justify-between'>
            {/* Username Pill */}
            <div className='flex items-center gap-2 px-3 py-2 rounded-2xl glass-morphism-strong border border-white/20'>
              <img
                src={avatarUrl}
                alt={profile.username}
                className='w-7 h-7 rounded-full object-cover'
              />
              <span className='text-sm font-medium text-white'>@{profile.username}</span>
            </div>

            {/* Follow/Edit Button */}
            {isOwnProfile ? (
              <Button
                className='px-4 py-2 rounded-2xl glass-morphism-strong border border-white/20 text-white font-semibold text-sm'
                onClick={() => router.push('/settings')}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                className={`px-4 py-2 rounded-2xl font-semibold text-sm border transition-all ${
                  isFollowing
                    ? 'glass-morphism-strong border-white/20 text-white'
                    : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600'
                }`}
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Join Circle'}
              </Button>
            )}
          </div>

          {/* Bottom Overlay - Display Name & Mood */}
          <div className='absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between'>
            {/* Display Name */}
            <div className='flex items-center gap-2'>
              <h1 className='text-3xl font-bold text-white drop-shadow-lg' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                {profile.full_name || profile.username}
              </h1>
              {profile.is_verified && (
                <div className='w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center'>
                  <HeroIcon iconName='CheckIcon' className='h-4 w-4 text-white' />
                </div>
              )}
            </div>

            {/* Mood/Status */}
            {profile.bio && (
              <div className='px-3 py-1.5 rounded-2xl glass-morphism-strong border border-white/20'>
                <span className='text-xs font-medium text-white'>✨ Chill AF</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info Section */}
        <div className='px-6 py-6'>
          {/* Username */}
          <p className='text-white/80 text-base mb-2'>@{profile.username}</p>

          {/* Title/Category */}
          {profile.bio && (
            <div className='inline-block px-3 py-1 rounded-lg glass-morphism border border-white/10 mb-4'>
              <p className='text-sm font-medium text-white/90'>{profile.bio.split('\n')[0]}</p>
            </div>
          )}

          {/* Bio */}
          {profile.bio && profile.bio.includes('\n') && (
            <p className='text-white/90 text-base mb-4 leading-relaxed'>
              {profile.bio.split('\n').slice(1).join('\n')}
            </p>
          )}

          {/* Website Link */}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4'
            >
              <HeroIcon iconName='LinkIcon' className='h-4 w-4' />
              <span className='text-sm font-medium'>{profile.website}</span>
            </a>
          )}

          {/* Circle Stats - iOS Style */}
          <div className='flex gap-4 mt-6'>
            {/* In Your Circle */}
            <button className='flex-1 p-4 rounded-2xl glass-morphism-light border border-white/10 hover:border-white/20 transition-all'>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <div className='flex -space-x-2'>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-black' />
                  ))}
                </div>
              </div>
              <p className='text-2xl font-bold text-white text-center'>{profile.followers_count?.toLocaleString() || 0}</p>
              <p className='text-sm text-white/60 text-center'>in your circle</p>
            </button>

            {/* Circles Joined */}
            <button className='flex-1 p-4 rounded-2xl glass-morphism-light border border-white/10 hover:border-white/20 transition-all'>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <div className='flex -space-x-2'>
                  {[1, 2].map((i) => (
                    <div key={i} className='w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 border-2 border-black' />
                  ))}
                </div>
              </div>
              <p className='text-2xl font-bold text-white text-center'>{profile.following_count?.toLocaleString() || 0}</p>
              <p className='text-sm text-white/60 text-center'>circles joined</p>
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className='flex gap-3 mt-6'>
            <button className='flex-1 py-3 rounded-2xl glass-morphism border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2'>
              <HeroIcon iconName='PencilIcon' className='h-5 w-5 text-white/80' />
            </button>
            <button className='flex-1 py-3 rounded-2xl glass-morphism border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2'>
              <HeroIcon iconName='VideoCameraIcon' className='h-5 w-5 text-white/80' />
            </button>
            <button className='flex-1 py-3 rounded-2xl glass-morphism border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2'>
              <HeroIcon iconName='ShoppingCartIcon' className='h-5 w-5 text-white/80' />
            </button>
            <button className='flex-1 py-3 rounded-2xl glass-morphism border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2'>
              <HeroIcon iconName='MusicalNoteIcon' className='h-5 w-5 text-white/80' />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-b border-white/5 mx-6'>
          <div className='flex gap-8'>
            {[
              { key: 'posts', label: 'Posts' },
              { key: 'replies', label: 'Replies' },
              { key: 'media', label: 'Media' },
              { key: 'likes', label: 'Likes' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className='relative py-4'
              >
                <span
                  className={`text-sm font-semibold transition-colors ${
                    activeTab === key
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                >
                  {label}
                </span>
                {activeTab === key && (
                  <motion.div
                    layoutId='activeTab'
                    className='absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full'
                    transition={{ duration: 0.3 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className='mt-0.5'>
        {postsLoading ? (
          <Loading className='mt-5' />
        ) : !posts || posts.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20'>
            <p className='text-xl font-semibold text-white'>No {activeTab} yet</p>
            <p className='text-white/60 text-sm mt-2'>When they whistle, it'll show up here</p>
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
