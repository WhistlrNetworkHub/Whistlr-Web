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

// iOS-style pagination constants (exact match with iOS MinisViewModel)
const BATCH_SIZE = 20; // iOS: 20 videos per batch
const INITIAL_LOAD_SIZE = 20; // iOS: Quick initial load
const PRELOAD_THRESHOLD = 5; // iOS: Trigger pagination when 5 videos remaining
const BACKGROUND_PRELOAD_COUNT = 2; // iOS: Only preload next 2 videos in real-time
const PREFETCH_BATCHES = 3; // iOS: Cache 3 batches ahead (60 videos total)
const MAX_CACHED_VIDEOS = 60; // iOS: Keep max 60 videos (3x batch size)

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

export default function Minis(): React.ReactElement {
  const { user } = useAuth();
  const [minis, setMinis] = useState<Mini[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // iOS-style: unmuted by default
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVideoId, setLastVideoId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<{ [key: number]: number }>({});
  const [prefetchedBatches, setPrefetchedBatches] = useState<{ [key: string]: Mini[] }>({});
  const [activePrefetchTasks, setActivePrefetchTasks] = useState<Set<string>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const playingRef = useRef<number>(-1);

  // iOS-style: Fetch videos from database with cursor-based pagination
  const fetchMinis = useCallback(async (isInitial = false) => {
    if (loadingMore && !isInitial) return;
    
    setLoadingMore(true);
    console.log(`🎥 [iOS-STYLE] Fetching ${isInitial ? 'initial' : 'next'} batch of ${BATCH_SIZE} videos...`);
    
    let query = supabase
      .from('posts')
      .select('*, user:author_id(*)')
      .eq('media_type', 'video')
      .not('media_urls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(BATCH_SIZE);
    
    // iOS-style: Cursor-based pagination for efficient scrolling
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
      console.error('❌ [iOS-STYLE] Error fetching minis:', error);
    } else {
      console.log(`✅ [iOS-STYLE] Fetched ${data?.length || 0} videos`);
      
      if (data && data.length > 0) {
        setMinis(prev => {
          const newVideos = isInitial ? data : [...prev, ...data];
          // iOS-style: Memory management - keep max 60 videos
          if (newVideos.length > MAX_CACHED_VIDEOS) {
            const excessCount = newVideos.length - MAX_CACHED_VIDEOS;
            console.log(`🧹 [iOS-STYLE] Memory cleanup: removing ${excessCount} old videos`);
            return newVideos.slice(excessCount);
          }
          return newVideos;
        });
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

  // iOS-style: Background preload only 2 videos ahead (real-time)
  const preloadVideo = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (video && video.readyState < 2) {
      video.load();
      console.log(`📥 [iOS-STYLE] Preloading video ${index}`);
    }
  }, []);

  // iOS-style: Preload next videos (exact iOS behavior: 2 ahead + 3 behind)
  const preloadNextVideos = useCallback((currentIndex: number) => {
    // iOS: Only preload next 2 videos in real-time (backgroundPreloadCount = 2)
    const endIndex = Math.min(currentIndex + BACKGROUND_PRELOAD_COUNT, minis.length - 1);
    
    for (let i = currentIndex + 1; i <= endIndex; i++) {
      if (i < minis.length) {
        preloadVideo(i);
      }
    }
    
    // iOS: Also preload 3 videos behind for reverse scrolling
    const startIndex = Math.max(0, currentIndex - 3);
    for (let i = startIndex; i < currentIndex; i++) {
      preloadVideo(i);
    }
    
    console.log(`🚀 [iOS-STYLE] Preloaded videos ${startIndex} to ${endIndex} (2 ahead + 3 behind)`);
  }, [minis.length, preloadVideo]);

  // iOS-style: Heavy prefetching system - prefetch 3 batches ahead in background
  const startHeavyPrefetching = useCallback(async () => {
    console.log(`🚀 [iOS-STYLE] Starting heavy prefetch: ${PREFETCH_BATCHES} batches ahead`);
    
    for (let batchOffset = 1; batchOffset <= PREFETCH_BATCHES; batchOffset++) {
      const prefetchKey = `batch_${batchOffset}`;
      
      // Skip if already prefetching or cached
      if (activePrefetchTasks.has(prefetchKey) || prefetchedBatches[prefetchKey]) {
        continue;
      }
      
      setActivePrefetchTasks(prev => new Set(prev).add(prefetchKey));
      
      try {
        // Fetch next batch in background
        const { data, error } = await supabase
          .from('posts')
          .select('*, user:author_id(*)')
          .eq('media_type', 'video')
          .not('media_urls', 'is', null)
          .order('created_at', { ascending: false })
          .range(minis.length + (batchOffset - 1) * BATCH_SIZE, minis.length + batchOffset * BATCH_SIZE - 1);
        
        if (!error && data && data.length > 0) {
          setPrefetchedBatches(prev => ({ ...prev, [prefetchKey]: data }));
          console.log(`✅ [iOS-STYLE] Heavy prefetch: cached batch ${batchOffset} (${data.length} videos)`);
        }
      } catch (error) {
        console.error(`❌ [iOS-STYLE] Heavy prefetch failed for batch ${batchOffset}:`, error);
      } finally {
        setActivePrefetchTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(prefetchKey);
          return newSet;
        });
      }
    }
  }, [minis.length, activePrefetchTasks, prefetchedBatches]);

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
            console.log(`👁️ [iOS-STYLE] Video ${index} is now visible (${index + 1}/${minis.length})`);
            setCurrentIndex(index);
            
            // iOS-style: Background preload only 2 videos ahead
            preloadNextVideos(index);
            
            // iOS-style: Early pagination trigger (when 5 videos remaining)
            const remainingVideos = minis.length - index;
            if (remainingVideos <= PRELOAD_THRESHOLD && hasMore && !loadingMore) {
              console.log(`🚀 [iOS-STYLE] ULTRA-FAST pagination trigger: ${remainingVideos} videos remaining (loading ${BATCH_SIZE} more)`);
              fetchMinis();
              // iOS: Start heavy prefetching in background
              startHeavyPrefetching();
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
  }, [currentIndex, minis.length, hasMore, loadingMore, fetchMinis, preloadNextVideos, startHeavyPrefetching]);

  // Auto-play current video with smooth transition
  useEffect(() => {
    if (minis.length === 0 || currentIndex < 0) return;
    
    const currentMini = minis[currentIndex];
    if (!currentMini) return;
    
    // Pause all other videos first
    videoRefs.current.forEach((video, idx) => {
      if (video && idx !== currentIndex && !video.paused) {
        video.pause();
        console.log(`⏸️ Paused video ${idx}`);
      }
    });
    
    // Track video play for performance monitoring
    performanceOptimizer.trackVideoPlay();
    
    // Play current video
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      const timer = setTimeout(() => {
        currentVideo.play()
          .then(() => {
            console.log(`▶️ Playing video ${currentIndex}`);
            setIsPlaying(true);
            playingRef.current = currentIndex;
          })
          .catch(err => {
            console.error(`❌ Error playing video ${currentIndex}:`, err);
            // Try again after a short delay
            setTimeout(() => {
              currentVideo.play().catch(e => console.error('Retry failed:', e));
            }, 500);
          });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, minis.length, minis]);

  // Removed old scroll handler - using Intersection Observer instead

  // iOS-style: Track video progress for scrubbing bar
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo) return;

    const handleTimeUpdate = () => {
      const progress = currentVideo.currentTime / currentVideo.duration;
      setVideoProgress(prev => ({ ...prev, [currentIndex]: progress }));
    };

    currentVideo.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      currentVideo.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentIndex]);

  // iOS-style: 8 vibrant accent colors that rotate for each video
  const getAccentColor = (videoId: string): string => {
    const colorPalette = [
      '#FF6600', // Orange
      '#FF3380', // Hot Pink
      '#8000FF', // Purple
      '#00B3FF', // Cyan
      '#00E666', // Mint Green
      '#FFCC00', // Gold
      '#FF4D4D', // Coral Red
      '#4DCCFF'  // Sky Blue
    ];
    
    // Use video ID hash to deterministically pick a color
    const hash = Math.abs(videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    return colorPalette[hash % colorPalette.length];
  };

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
                      const video = videoRefs.current[index];
                      if (video) {
                        if (video.paused) {
                          video.play().catch(e => console.error('Play error:', e));
                          setIsPlaying(true);
                        } else {
                          video.pause();
                          setIsPlaying(false);
                        }
                      }
                    }
                  }}
                >
                  {/* Using native HTML5 video */}
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    id={`video-${mini.id}`}
                    src={fullVideoUrl}
                    loop
                    muted={isMuted}
                    playsInline
                    preload={index <= currentIndex + BACKGROUND_PRELOAD_COUNT ? "auto" : "metadata"}
                    crossOrigin="anonymous"
                    autoPlay={index === 0}
                    className='h-full w-full object-cover'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      borderRadius: '32px'
                    }}
                    onLoadedMetadata={() => {
                      console.log('✅ Video loaded metadata:', index);
                      const video = videoRefs.current[index];
                      if (video && index === currentIndex) {
                        video.play().catch(e => console.error('Play error:', e));
                      }
                    }}
                    onCanPlay={() => {
                      console.log('✅ Video can play:', index);
                      const video = videoRefs.current[index];
                      if (video && index === currentIndex && video.paused) {
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

              {/* iOS-style: Avatar in top right corner */}
              <div className='absolute top-16 right-4 z-20'>
                <UserAvatar
                  src={mini.user.avatar_url}
                  alt={mini.user.full_name}
                  username={mini.user.username}
                  size={48}
                  className='border-2 border-white shadow-lg'
                />
              </div>

              {/* iOS-style: Mute/Unmute button in top right (below avatar) */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className='absolute top-28 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition hover:bg-black/70'
              >
                <HeroIcon
                  className='h-5 w-5 text-white'
                  iconName={isMuted ? 'SpeakerXMarkIcon' : 'SpeakerWaveIcon'}
                  solid
                />
              </button>

              {/* iOS-style: Bottom overlay with accent bar + caption */}
              <div className='absolute inset-0 flex flex-col justify-end p-4 pointer-events-none'>
                <div className='flex items-end justify-between'>
                  {/* iOS-style: Left side - Accent bar + Caption + Username + Join button */}
                  <div className='flex-1 pb-24 pointer-events-auto'>
                    <div className='flex items-center gap-3'>
                      {/* iOS-style: Vertical colored accent bar */}
                      <div 
                        className='h-20 w-1 rounded-full'
                        style={{
                          background: `linear-gradient(180deg, ${getAccentColor(mini.id)} 0%, transparent 100%)`
                        }}
                      />
                      
                      {/* Caption + Username + Join */}
                      <div className='flex-1'>
                        {/* Caption (bold, white, iOS-style) */}
                        {mini.content && (
                          <p className='text-sm font-bold text-white mb-1 line-clamp-2 drop-shadow-lg'>
                            {mini.content}
                          </p>
                        )}
                        
                        {/* Username + Join button */}
                        <div className='flex items-center gap-2'>
                          <p className='text-xs text-white/90 drop-shadow-lg'>@{mini.user.username}</p>
                          
                          {/* iOS-style: Join button with accent color */}
                          <button 
                            className='px-2 py-1 text-xs font-semibold text-white rounded-full'
                            style={{
                              backgroundColor: getAccentColor(mini.id)
                            }}
                          >
                            Join •
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* iOS-style: Right side - Action buttons */}
                  <div className='flex flex-col items-center gap-6 pb-24 pointer-events-auto'>
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
                      <span className='text-xs font-semibold text-white drop-shadow-lg'>{mini.likes_count}</span>
                    </button>

                    {/* Comment button */}
                    <button className='flex flex-col items-center gap-1 transition hover:scale-110'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                        <HeroIcon className='h-7 w-7 text-white' iconName='ChatBubbleOvalLeftIcon' />
                      </div>
                      <span className='text-xs font-semibold text-white drop-shadow-lg'>{mini.comments_count}</span>
                    </button>

                    {/* Share button */}
                    <button className='flex flex-col items-center gap-1 transition hover:scale-110'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                        <HeroIcon className='h-7 w-7 text-white' iconName='PaperAirplaneIcon' />
                      </div>
                      <span className='text-xs font-semibold text-white drop-shadow-lg'>{mini.shares_count}</span>
                    </button>
                  </div>
                </div>

                {/* iOS-style: Video progress bar at bottom */}
                <div className='absolute bottom-0 left-0 right-0 h-1 bg-white/20'>
                  <div 
                    className='h-full bg-white'
                    style={{
                      width: `${(videoProgress[index] || 0) * 100}%`,
                      transition: 'width 0.1s linear'
                    }}
                  />
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
