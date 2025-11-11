import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@lib/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { useInfiniteScroll } from '@lib/hooks/useInfiniteScroll';
import { useModal } from '@lib/hooks/useModal';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Tweet } from '@components/tweet/tweet';
import { Loading } from '@components/ui/loading';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { FollowersModal } from '@components/modal/followers-modal';
import type { ReactElement, ReactNode } from 'react';

export default function UserProfile(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts');
  const [modalType, setModalType] = useState<'followers' | 'following'>('followers');
  const [followerAvatars, setFollowerAvatars] = useState<string[]>([]);
  const [followingAvatars, setFollowingAvatars] = useState<string[]>([]);
  
  const { open: followModalOpen, openModal: openFollowModal, closeModal: closeFollowModal } = useModal();

  const { data: posts, loading: postsLoading, LoadMore } = useInfiniteScroll(
    'posts',
    {
      filters: activeTab === 'posts' && profile?.id ? [{ column: 'author_id', operator: 'eq', value: profile.id }] : [],
      orderBy: { column: 'created_at', ascending: false }
    },
    { includeUser: true, disabled: !profile?.id || activeTab !== 'posts' }
  );

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        // Query by username (most common case)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', id)
          .maybeSingle();

        console.log('👤 Loaded profile:', data);
        console.log('🆔 Profile ID (UUID):', data?.id);
        console.log('👤 Profile username:', data?.username);

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
        } else {
          // If not found by username, try by ID
          const { data: dataById, error: errorById } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!errorById && dataById) {
            setProfile(dataById);

            if (currentUser && currentUser.id !== dataById.id) {
              const { data: followData } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', currentUser.id)
                .eq('following_id', dataById.id)
                .maybeSingle();

              setIsFollowing(!!followData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, currentUser]);

  // Load follower and following avatars
  useEffect(() => {
    if (!profile?.id) return;

    const loadAvatars = async () => {
      try {
        // Load follower avatars (first 3)
        const { data: followersData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', profile.id)
          .limit(3);

        if (followersData && followersData.length > 0) {
          const followerIds = followersData.map((f) => f.follower_id);
          const { data: usersData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .in('id', followerIds);

          if (usersData) {
            setFollowerAvatars(usersData.map((u) => u.avatar_url || '/default-avatar.png'));
          }
        }

        // Load following avatars (first 2)
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', profile.id)
          .limit(2);

        if (followingData && followingData.length > 0) {
          const followingIds = followingData.map((f) => f.following_id);
          const { data: usersData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .in('id', followingIds);

          if (usersData) {
            setFollowingAvatars(usersData.map((u) => u.avatar_url || '/default-avatar.png'));
          }
        }
      } catch (error) {
        console.error('Error loading avatars:', error);
      }
    };

    loadAvatars();
  }, [profile?.id]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
        
        // Update follower count
        await supabase
          .from('profiles')
          .update({ followers_count: Math.max(0, (profile.followers_count || 1) - 1) })
          .eq('id', profile.id);
        
        setProfile({ ...profile, followers_count: Math.max(0, (profile.followers_count || 1) - 1) });
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profile.id });
        
        // Update follower count
        await supabase
          .from('profiles')
          .update({ followers_count: (profile.followers_count || 0) + 1 })
          .eq('id', profile.id);
        
        setProfile({ ...profile, followers_count: (profile.followers_count || 0) + 1 });
      }

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (loading) return <Loading className='mt-20' />;
  if (!profile) return (
    <MainContainer>
      <div className='text-center mt-20 text-white'>
        <p className='text-2xl font-bold mb-2'>This account doesn't exist</p>
        <p className='text-white/60'>Try searching for another.</p>
      </div>
    </MainContainer>
  );

  const isOwnProfile = currentUser?.id === profile.id;
  const coverUrl = profile.cover_url || profile.avatar_url || '/default-avatar.png';
  const avatarUrl = profile.avatar_url || '/default-avatar.png';

  return (
    <MainContainer>
      <SEO title={`${profile.full_name || profile.username} (@${profile.username}) / Whistlr`} />

      <FollowersModal
        open={followModalOpen}
        closeModal={() => {
          console.log('🚪 Closing modal');
          closeFollowModal();
        }}
        profileId={profile.id}
        type={modalType}
        username={profile.username}
      />
      {/* Debug modal state */}
      {followModalOpen && (
        <div style={{ position: 'fixed', top: 10, right: 10, background: 'black', color: 'lime', padding: '10px', zIndex: 9999, fontSize: '12px', fontFamily: 'monospace', border: '2px solid lime' }}>
          <strong>DEBUG INFO:</strong><br />
          Modal Type: <strong style={{ color: modalType === 'followers' ? 'cyan' : 'yellow' }}>{modalType}</strong><br />
          Profile ID: <span style={{ color: 'orange' }}>{profile.id}</span><br />
          Username: {profile.username}<br />
          Is UUID?: {profile.id?.includes('-') ? '✅ YES' : '❌ NO (might be username!)'}
        </div>
      )}

      {/* iOS-Style Profile Header with Cover Banner */}
      <div className='relative'>
        {/* Cover Photo Banner - Slightly Taller */}
        <div className='relative h-[580px] mx-4 mt-4 rounded-3xl overflow-hidden'>
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

          {/* Top Left - Back Button (only for other users) */}
          {!isOwnProfile && (
            <div className='absolute top-5 left-5'>
              <Button
                className='p-2 rounded-full glass-morphism-strong border border-white/20 hover:border-white/30 transition-all'
                onClick={() => router.back()}
              >
                <HeroIcon iconName='ArrowLeftIcon' className='h-5 w-5 text-white' />
              </Button>
            </div>
          )}

          {/* Top Right - Follow/Edit Button */}
          <div className='absolute top-5 right-5'>
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

          {/* Bottom Left - Display Name */}
          <div className='absolute bottom-5 left-5'>
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
          </div>

          {/* Bottom Right - Mood/Status */}
          {profile.bio && (
            <div className='absolute bottom-5 right-5'>
              <div className='inline-block px-3 py-1.5 rounded-2xl glass-morphism-strong border border-white/20'>
                <span className='text-xs font-medium text-white'>✨ Chill AF</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className='px-6 py-6'>
          {/* Username */}
          <p className='text-white/80 text-base mb-4'>@{profile.username}</p>

          {/* Bio - Floating with no background */}
          {profile.bio && (
            <p className='text-white/90 text-base mb-4 leading-relaxed'>
              {profile.bio}
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

          {/* Circle Stats - iOS Style with Real Avatars */}
          <div className='flex gap-4 mt-6'>
            {/* In Your Circle - Followers */}
            <button 
              className='flex-1 p-4 rounded-2xl glass-morphism-light border border-white/10 hover:border-white/20 transition-all'
              onClick={() => {
                console.log('🔵 FOLLOWERS button clicked - setting modalType to followers');
                setModalType('followers');
                openFollowModal();
              }}
            >
              <div className='flex items-center justify-center gap-2 mb-2'>
                <div className='flex -space-x-2'>
                  {followerAvatars.length > 0 ? (
                    followerAvatars.map((avatar, i) => (
                      <img
                        key={i}
                        src={avatar}
                        alt='Follower'
                        className='w-8 h-8 rounded-full object-cover border-2 border-black'
                      />
                    ))
                  ) : (
                    [1, 2, 3].map((i) => (
                      <div key={i} className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-black' />
                    ))
                  )}
                </div>
              </div>
              <p className='text-2xl font-bold text-white text-center'>{profile.followers_count?.toLocaleString() || 0}</p>
              <p className='text-sm text-white/60 text-center'>in your circle</p>
            </button>

            {/* Circles Joined - Following */}
            <button 
              className='flex-1 p-4 rounded-2xl glass-morphism-light border border-white/10 hover:border-white/20 transition-all'
              onClick={() => {
                console.log('🟢 FOLLOWING button clicked - setting modalType to following');
                setModalType('following');
                openFollowModal();
              }}
            >
              <div className='flex items-center justify-center gap-2 mb-2'>
                <div className='flex -space-x-2'>
                  {followingAvatars.length > 0 ? (
                    followingAvatars.map((avatar, i) => (
                      <img
                        key={i}
                        src={avatar}
                        alt='Following'
                        className='w-8 h-8 rounded-full object-cover border-2 border-black'
                      />
                    ))
                  ) : (
                    [1, 2].map((i) => (
                      <div key={i} className='w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 border-2 border-black' />
                    ))
                  )}
                </div>
              </div>
              <p className='text-2xl font-bold text-white text-center'>{profile.following_count?.toLocaleString() || 0}</p>
              <p className='text-sm text-white/60 text-center'>circles joined</p>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-b border-white/5 mx-6 mt-6'>
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
            <p className='text-white/60 text-sm mt-2'>When they post, it'll show up here</p>
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
