import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@lib/supabase/client';
import { useAuth } from '@lib/context/auth-context';
import { videoManager } from '@lib/video/VideoManager';
import { performanceOptimizer } from '@lib/video/PerformanceOptimizer';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Loading } from '@components/ui/loading';
import { HeroIcon } from '@components/ui/hero-icon';
import { UserAvatar } from '@components/user/user-avatar';
import type { ReactElement, ReactNode } from 'react';

// Get optimized settings based on device
const optimizationStrategy = performanceOptimizer.getOptimizedInitStrategy();
const BATCH_SIZE = optimizationStrategy.prefetchDistance; // Device-adaptive batch size
const PRELOAD_COUNT = optimizationStrategy.videoPrefetchCount; // Device-adaptive preload

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
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVideoId, setLastVideoId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const playingRef = useRef<number>(-1);

  // Fetch initial batch of videos
  const fetchMinis = useCallback(async (isInitial = false) => {
    if (loadingMore && !isInitial) return;
    
    setLoadingMore(true);
    console.log('🎥 Fetching minis...');
    
    let query = supabase
      .from('posts')
      .select('*, user:author_id(*)')
      .eq('media_type', 'video')
      .not('media_urls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(BATCH_SIZE);
    
    // Pagination: fetch videos after last loaded video
    if (lastVideoId && !isInitial) {
      const { data: lastVideo } = await supabase
        .from('posts')
        .select('created_at')
        .eq('id', lastVideoId)
        .single();
      
      if (lastVideo) {
        query = query.lt('created_at', lastVideo.created_at);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching minis:', error);
    } else {
      console.log('✅ Fetched minis:', data?.length || 0, 'videos');
      
      if (data && data.length > 0) {
        setMinis(prev => isInitial ? data : [...prev, ...data]);
        setLastVideoId(data[data.length - 1].id);
        setHasMore(data.length === BATCH_SIZE);
      } else {
        setHasMore(false);
      }
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [lastVideoId, loadingMore]);

  // Initial load and session start
  useEffect(() => {
    // Start performance tracking session
    performanceOptimizer.startSession();
    console.log('📊 [MINIS] Performance tracking started');
    console.log(performanceOptimizer.getPerformanceReport());
    
    fetchMinis(true);
    
    return () => {
      // Cleanup on unmount
      videoManager.cleanupAllPlayers();
    };
  }, []);

  // Preload adjacent videos
  const preloadVideo = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (video && video.readyState < 2) {
      video.load();
      console.log(`📥 Preloading video ${index}`);
    }
  }, []);

  // Intersection Observer for precise scroll detection
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.75 // Video must be 75% visible to be considered "current"
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
          const videoElement = entry.target as HTMLElement;
          const index = parseInt(videoElement.dataset.index || '0');
          
          if (index !== currentIndex) {
            console.log(`👁️ Video ${index} is now visible`);
            setCurrentIndex(index);
            
            // Preload next videos
            for (let i = 1; i <= PRELOAD_COUNT; i++) {
              if (index + i < minis.length) {
                preloadVideo(index + i);
              }
            }
            
            // Load more when near end
            if (hasMore && !loadingMore && index >= minis.length - 3) {
              console.log('📊 Near end, loading more videos...');
              fetchMinis();
            }
          }
        }
      });
    }, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentIndex, minis.length, hasMore, loadingMore, fetchMinis, preloadVideo]);

  // Auto-play current video with smooth transition using VideoManager
  useEffect(() => {
    if (minis.length > 0 && currentIndex >= 0) {
      const currentMini = minis[currentIndex];
      if (!currentMini) return;
      
      // Track video play for performance monitoring
      performanceOptimizer.trackVideoPlay();
      
      // Use VideoManager for centralized playback control
      const timer = setTimeout(() => {
        videoManager.playVideo(currentMini.id);
        setIsPlaying(true);
        playingRef.current = currentIndex;
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, minis.length, minis]);

  // Removed old scroll handler - using Intersection Observer instead

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
      
      {loading ? (
        <Loading className='mt-5' />
      ) : minis.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20'>
          <HeroIcon className='mb-4 h-16 w-16 text-light-secondary' iconName='VideoCameraIcon' />
          <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No minis yet</p>
          <p className='mt-2 text-light-secondary dark:text-dark-secondary'>Video content will appear here</p>
        </div>
      ) : (
        <div className='relative' style={{ height: '100vh' }}>
          {/* Floating Title - Instagram Style */}
          <div className='absolute top-6 left-6 z-50 pointer-events-none'>
            <h1 className='text-white text-3xl font-semibold tracking-tight' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              Minis
            </h1>
          </div>
          
          {/* TikTok-style vertical scroll container with device corners */}
          <div
            ref={containerRef}
            className='hide-scrollbar h-full snap-y snap-mandatory overflow-y-scroll'
            style={{ 
              scrollBehavior: 'smooth',
              padding: '0 8px'
            }}
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
              data-index={index}
              ref={(el) => {
                if (el && observerRef.current) {
                  observerRef.current.observe(el);
                }
              }}
              className='relative flex w-full snap-start snap-always items-center justify-center overflow-hidden'
              style={{ height: '100vh', borderRadius: '0 0 0 0' }}
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
                  {/* Using native HTML5 video with VideoManager integration */}
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                      // Register with VideoManager
                      if (el && fullVideoUrl) {
                        const managedVideo = videoManager.getPlayer(mini.id, fullVideoUrl);
                        // Copy managed video attributes to our ref
                        videoRefs.current[index] = managedVideo;
                      }
                    }}
                    id={`video-${mini.id}`}
                    src={fullVideoUrl}
                    loop
                    muted
                    playsInline
                    preload={index <= currentIndex + PRELOAD_COUNT ? "auto" : "metadata"}
                    crossOrigin="anonymous"
                    className='h-full w-full object-cover'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      borderRadius: '32px'
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
                    <div className='absolute inset-0 flex items-center justify-center glass-morphism-light pointer-events-none'>
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
          
          {/* Loading more indicator */}
          {loadingMore && (
            <div className='flex items-center justify-center py-8'>
              <Loading />
            </div>
          )}
          
          {/* End of content */}
          {!hasMore && minis.length > 0 && (
            <div className='flex items-center justify-center py-8 text-light-secondary dark:text-dark-secondary'>
              <p>You've reached the end! 🎉</p>
            </div>
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
