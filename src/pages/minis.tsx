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
  media_urls: string[];
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
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRefs = useRef<any[]>([]);
  const playingRef = useRef<number>(-1);

  useEffect(() => {
    const fetchMinis = async () => {
      console.log('🎥 Fetching minis...');
      
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:author_id(*)')
        .eq('media_type', 'video')
        .not('media_urls', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching minis:', error);
      } else {
        console.log('✅ Fetched minis:', data?.length || 0, 'videos');
        console.log('📝 Sample mini:', data?.[0]);
        setMinis((data || []) as Mini[]);
      }
      setLoading(false);
    };

    fetchMinis();
  }, []);

  // Auto-play current video
  useEffect(() => {
    if (minis.length > 0 && currentIndex >= 0) {
      console.log('🎬 Switching to video index:', currentIndex);
      
      // Stop previous video
      if (playingRef.current >= 0 && playingRef.current !== currentIndex) {
        console.log('⏹️ Stopping video:', playingRef.current);
      }
      
      // Start current video after a delay
      const timer = setTimeout(() => {
        playingRef.current = currentIndex;
        setIsPlaying(true);
        console.log('▶️ Auto-playing video:', currentIndex);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, minis.length]);

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
          {minis.map((mini, index) => {
            const videoUrl = mini.media_urls?.[0];
            
            // Build proper video URL
            let fullVideoUrl = videoUrl;
            
            if (videoUrl?.startsWith('http')) {
              // Already a full URL, just fix domain if needed
              fullVideoUrl = videoUrl.replace(
                'phdgiqhcirgddxwgxpxy.supabase.co',
                'phdgiqhcidqnfuwxszco.supabase.co'
              );
            } else if (videoUrl) {
              // Relative path - construct full URL with correct bucket
              const { data } = supabase.storage
                .from('post_videos')
                .getPublicUrl(videoUrl);
              fullVideoUrl = data.publicUrl;
            }
            
            console.log(`📹 Video ${index}:`, {
              original: videoUrl,
              final: fullVideoUrl
            });
            
            return (
            <div
              key={mini.id}
              className='relative flex w-full snap-start snap-always items-center justify-center bg-black'
              style={{ height: 'calc(100vh - 120px)' }}
            >
              {/* Video player */}
              {fullVideoUrl ? (
                <div 
                  className='relative h-full w-full'
                  onClick={() => {
                    if (index === currentIndex) {
                      const video = document.getElementById(`video-${index}`) as HTMLVideoElement;
                      if (video) {
                        if (video.paused) {
                          video.play();
                          setIsPlaying(true);
                        } else {
                          video.pause();
                          setIsPlaying(false);
                        }
                      }
                    }
                  }}
                >
                  {/* Using native HTML5 video with proper attributes for Supabase */}
                  <video
                    id={`video-${index}`}
                    src={fullVideoUrl}
                    loop
                    muted
                    playsInline
                    autoPlay={index === currentIndex}
                    controls
                    preload="metadata"
                    crossOrigin="anonymous"
                    className='h-full w-full object-cover'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      backgroundColor: '#000'
                    }}
                    onLoadedMetadata={() => {
                      console.log('✅ Video loaded metadata:', index);
                      const video = document.getElementById(`video-${index}`) as HTMLVideoElement;
                      if (video && index === currentIndex) {
                        video.play().catch(e => console.error('Play error:', e));
                      }
                    }}
                    onError={async (e) => {
                      console.error('❌ Video error:', index, fullVideoUrl);
                      console.error('Error details:', e.currentTarget.error);
                      console.log('Trying to load video with fetch...');
                      
                      // Try loading via fetch and blob URL
                      try {
                        const response = await fetch(fullVideoUrl, {
                          method: 'GET',
                          mode: 'cors',
                          credentials: 'omit'
                        });
                        
                        if (response.ok) {
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          console.log('✅ Created blob URL:', blobUrl);
                          
                          const video = document.getElementById(`video-${index}`) as HTMLVideoElement;
                          if (video) {
                            video.src = blobUrl;
                          }
                        } else {
                          console.error('Fetch failed:', response.status, response.statusText);
                        }
                      } catch (fetchError) {
                        console.error('Blob fetch failed:', fetchError);
                      }
                    }}
                    onPlay={() => console.log('▶️ Video playing:', index)}
                    onLoadStart={() => console.log('🔄 Video loading:', index)}
                  />
                  {/* Play/Pause indicator */}
                  {index === currentIndex && !isPlaying && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none'>
                      <div className='rounded-full bg-white/90 p-4'>
                        <HeroIcon className='h-12 w-12 text-black' iconName='PlayIcon' solid />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center text-white'>
                  <p>No video URL</p>
                </div>
              )}

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
          )}
          )}
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
