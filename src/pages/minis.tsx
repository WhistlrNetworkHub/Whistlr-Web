import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@lib/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Loading } from '@components/ui/loading';
import { HeroIcon } from '@components/ui/hero-icon';
import { UserAvatar } from '@components/user/user-avatar';
import type { ReactElement, ReactNode } from 'react';

interface Mini {
  id: string;
  content: string;
  media_url: string[];
  media_type: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function Minis(): JSX.Element {
  const { user } = useAuth();
  const [minis, setMinis] = useState<Mini[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const fetchMinis = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:author_id(*)')
        .eq('media_type', 'video')
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching minis:', error);
      } else {
        setMinis((data || []) as Mini[]);
      }
      setLoading(false);
    };

    fetchMinis();
  }, []);

  // Auto-play current video
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    }

    // Pause all other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const videoHeight = window.innerHeight;
    const newIndex = Math.round(scrollPosition / videoHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < minis.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, minis.length]);

  const handleLike = async (miniId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', miniId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase.from('post_likes').delete().eq('post_id', miniId).eq('user_id', user.id);
        
        // Update local state
        setMinis((prev) =>
          prev.map((mini) =>
            mini.id === miniId ? { ...mini, likes_count: mini.likes_count - 1 } : mini
          )
        );
      } else {
        // Like
        await supabase.from('post_likes').insert({ post_id: miniId, user_id: user.id });
        
        // Update local state
        setMinis((prev) =>
          prev.map((mini) =>
            mini.id === miniId ? { ...mini, likes_count: mini.likes_count + 1 } : mini
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <MainContainer>
      <SEO title='Minis / Whistlr' />
      <MainHeader title='Minis' className='flex items-center justify-between' />
      
      {loading ? (
        <Loading className='mt-5' />
      ) : minis.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20'>
          <HeroIcon className='mb-4 h-16 w-16 text-light-secondary' iconName='VideoCameraIcon' />
          <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No minis yet</p>
          <p className='mt-2 text-light-secondary dark:text-dark-secondary'>Video content will appear here</p>
        </div>
      ) : (
        <div className='relative' style={{ height: 'calc(100vh - 120px)' }}>
          {/* TikTok-style vertical scroll container */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className='hide-scrollbar h-full snap-y snap-mandatory overflow-y-scroll'
            style={{ scrollBehavior: 'smooth' }}
          >
          {minis.map((mini, index) => (
            <div
              key={mini.id}
              className='relative flex w-full snap-start snap-always items-center justify-center bg-black'
              style={{ height: 'calc(100vh - 120px)' }}
            >
              {/* Video player */}
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={mini.media_url?.[0]}
                loop
                playsInline
                muted={false}
                className='h-full w-full object-contain'
                onClick={(e) => {
                  const video = e.currentTarget;
                  if (video.paused) {
                    video.play();
                  } else {
                    video.pause();
                  }
                }}
              />

              {/* Overlay UI */}
              <div className='absolute inset-0 flex flex-col justify-end p-4'>
                <div className='flex items-end justify-between'>
                  {/* Left side - User info and caption */}
                  <div className='flex-1 pb-20'>
                    <div className='flex items-center gap-3 mb-3'>
                      <UserAvatar
                        src={mini.user.avatar_url}
                        alt={mini.user.full_name}
                        username={mini.user.username}
                        className='h-12 w-12 border-2 border-white'
                      />
                      <div>
                        <p className='font-bold text-white'>{mini.user.full_name}</p>
                        <p className='text-sm text-white/80'>@{mini.user.username}</p>
                      </div>
                    </div>
                    {mini.content && (
                      <p className='text-white line-clamp-3'>{mini.content}</p>
                    )}
                  </div>

                  {/* Right side - Action buttons */}
                  <div className='flex flex-col items-center gap-6 pb-20'>
                    {/* Like button */}
                    <button
                      onClick={() => handleLike(mini.id)}
                      className='flex flex-col items-center gap-1 transition hover:scale-110'
                    >
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                        <HeroIcon
                          className='h-7 w-7 text-white'
                          iconName='HeartIcon'
                          solid={false}
                        />
                      </div>
                      <span className='text-xs font-semibold text-white'>{mini.likes_count}</span>
                    </button>

                    {/* Comment button */}
                    <button className='flex flex-col items-center gap-1 transition hover:scale-110'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                        <HeroIcon className='h-7 w-7 text-white' iconName='ChatBubbleOvalLeftIcon' />
                      </div>
                      <span className='text-xs font-semibold text-white'>{mini.comments_count}</span>
                    </button>

                    {/* Share button */}
                    <button className='flex flex-col items-center gap-1 transition hover:scale-110'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                        <HeroIcon className='h-7 w-7 text-white' iconName='PaperAirplaneIcon' />
                      </div>
                      <span className='text-xs font-semibold text-white'>{mini.shares_count}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      )}
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
