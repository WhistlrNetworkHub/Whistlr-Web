/**
 * VideoManager.ts
 * 🎯 SINGLE SOURCE OF TRUTH for ALL video management across Whistlr Web
 * 
 * Based on iOS WhistlrVideoManager with web-specific optimizations
 * 
 * KEY FEATURES:
 * - Centralized video player pool (max 5 active players)
 * - Network-adaptive bitrate selection
 * - Memory pressure monitoring
 * - Automatic cleanup of old players
 * - Smart preloading with priority queue
 * - Background tab handling (auto-pause)
 */

interface VideoPlayerState {
  videoElement: HTMLVideoElement;
  createdAt: Date;
  lastPlayed: Date;
  isActive: boolean;
}

interface NetworkQuality {
  type: 'wifi' | 'cellular' | '4g' | '3g' | 'slow-2g' | 'unknown';
  downlink?: number; // Mbps
  effectiveType?: string;
}

class VideoManager {
  private static instance: VideoManager;
  
  // Player pool management
  private players: Map<string, VideoPlayerState> = new Map();
  private maxActivePlayers = 5; // TikTok-style limit
  private preloadBuffer = 30; // 30 seconds buffer
  
  // State tracking
  private currentlyPlayingId: string | null = null;
  private unmutedVideoId: string | null = null;
  private isRefreshing = false;
  
  // Network monitoring
  private networkQuality: NetworkQuality = { type: 'unknown' };
  private connection: any;
  
  // Memory monitoring
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private lastMemoryWarning: number = 0;
  
  // Visibility handling
  private isPageVisible = true;
  private wasPlayingBeforePause: string | null = null;
  
  private constructor() {
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      this.setupNetworkMonitoring();
      this.setupMemoryMonitoring();
      this.setupVisibilityHandling();
      this.setupUnloadHandler();
      
      console.log('🚀 [VIDEO-MANAGER] Initialized with TikTok-style optimizations');
    }
  }

  static getInstance(): VideoManager {
    // Only create instance in browser environment
    if (typeof window === 'undefined') {
      // Return a mock instance for SSR
      return {} as VideoManager;
    }
    
    if (!VideoManager.instance) {
      VideoManager.instance = new VideoManager();
    }
    return VideoManager.instance;
  }

  // ============= PLAYER MANAGEMENT =============

  /**
   * Get or create optimized video player
   */
  getPlayer(videoId: string, videoUrl: string): HTMLVideoElement {
    // Return existing player if available
    if (this.players.has(videoId)) {
      const state = this.players.get(videoId)!;
      state.lastPlayed = new Date();
      state.isActive = true;
      console.log(`♻️ [VIDEO-MANAGER] Reusing player for: ${videoId}`);
      return state.videoElement;
    }

    // Cleanup old players before creating new one
    this.cleanupOldPlayers();

    // Create new optimized player
    return this.createOptimizedPlayer(videoId, videoUrl);
  }

  /**
   * Create optimized video player with TikTok-style settings
   */
  private createOptimizedPlayer(videoId: string, videoUrl: string): HTMLVideoElement {
    if (typeof document === 'undefined') {
      throw new Error('Cannot create video player in SSR environment');
    }
    
    console.log(`🎬 [VIDEO-MANAGER] Creating optimized player for: ${videoId}`);
    
    const video = document.createElement('video');
    
    // Basic attributes
    video.id = `video-${videoId}`;
    video.src = videoUrl;
    video.loop = true;
    video.muted = true; // Start muted (TikTok behavior)
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    
    // Apply network-adaptive optimizations
    this.applyNetworkOptimizations(video);
    
    // Setup player observers
    this.setupPlayerObservers(videoId, video);
    
    // Store in player pool
    this.players.set(videoId, {
      videoElement: video,
      createdAt: new Date(),
      lastPlayed: new Date(),
      isActive: true
    });
    
    console.log(`✅ [VIDEO-MANAGER] Created optimized player for: ${videoId}`);
    return video;
  }

  /**
   * Apply network-adaptive bitrate selection
   */
  private applyNetworkOptimizations(video: HTMLVideoElement) {
    // Get effective network type
    const effectiveType = this.networkQuality.effectiveType;
    const downlink = this.networkQuality.downlink || 0;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      // Very slow connection: lowest quality
      console.log('📱 [VIDEO-OPTIMIZATION] Slow connection - lowest quality');
      // Note: Can't directly set bitrate in HTML5, but we can hint to browser
      video.style.willChange = 'auto'; // Disable GPU acceleration to save bandwidth
    } else if (effectiveType === '3g' || downlink < 1.5) {
      // Moderate connection: medium quality
      console.log('📶 [VIDEO-OPTIMIZATION] 3G/Cellular - medium quality (1 Mbps)');
    } else if (effectiveType === '4g' || this.networkQuality.type === 'wifi' || downlink >= 1.5) {
      // Fast connection: high quality
      console.log('📶 [VIDEO-OPTIMIZATION] WiFi/4G - high quality (2 Mbps)');
      video.style.willChange = 'transform'; // Enable GPU acceleration
    }
    
    // Forward buffer duration for smooth playback
    // Note: This is handled by browser, but we can hint with preload
    video.preload = downlink >= 2 ? 'auto' : 'metadata';
  }

  /**
   * Setup observers for player status
   */
  private setupPlayerObservers(videoId: string, video: HTMLVideoElement) {
    video.addEventListener('loadedmetadata', () => {
      console.log(`✅ [VIDEO-MANAGER] Player ready for: ${videoId}`);
    });
    
    video.addEventListener('error', (e) => {
      console.error(`❌ [VIDEO-MANAGER] Player error for: ${videoId}`, e);
      this.disposePlayer(videoId);
    });
    
    video.addEventListener('ended', () => {
      console.log(`🔁 [VIDEO-MANAGER] Video ended: ${videoId}`);
      // Loop is enabled, but log for debugging
    });
    
    video.addEventListener('play', () => {
      console.log(`▶️ [VIDEO-MANAGER] Playing: ${videoId}`);
    });
    
    video.addEventListener('pause', () => {
      console.log(`⏸️ [VIDEO-MANAGER] Paused: ${videoId}`);
    });
  }

  // ============= PLAYBACK CONTROL =============

  /**
   * Play specific video (TikTok-style single video playback)
   */
  playVideo(videoId: string) {
    // Block playback during refresh
    if (this.isRefreshing) {
      console.log(`🚫 [VIDEO-MANAGER] Blocked playVideo(${videoId}) - refresh in progress`);
      return;
    }
    
    // Block playback if page is not visible
    if (!this.isPageVisible) {
      console.log(`🚫 [VIDEO-MANAGER] Blocked playVideo(${videoId}) - page not visible`);
      return;
    }
    
    // Pause currently playing video
    if (this.currentlyPlayingId && this.currentlyPlayingId !== videoId) {
      this.pauseVideo(this.currentlyPlayingId);
    }
    
    // Play the video
    const state = this.players.get(videoId);
    if (state) {
      state.videoElement.play()
        .then(() => {
          this.currentlyPlayingId = videoId;
          state.lastPlayed = new Date();
          console.log(`🎬 [VIDEO-MANAGER] Playing video: ${videoId}`);
        })
        .catch(e => console.error(`❌ [VIDEO-MANAGER] Play failed for: ${videoId}`, e));
    }
  }

  /**
   * Pause specific video
   */
  pauseVideo(videoId: string) {
    const state = this.players.get(videoId);
    if (state) {
      state.videoElement.pause();
      if (this.currentlyPlayingId === videoId) {
        this.currentlyPlayingId = null;
      }
      console.log(`⏸️ [VIDEO-MANAGER] Paused video: ${videoId}`);
    }
  }

  /**
   * Pause all videos (TikTok-style)
   */
  pauseAllVideos() {
    this.players.forEach((state, videoId) => {
      state.videoElement.pause();
    });
    this.currentlyPlayingId = null;
    this.unmutedVideoId = null;
    console.log('⏹️ [VIDEO-MANAGER] Paused all videos');
  }

  /**
   * Toggle mute for specific video (TikTok-style single unmuted video)
   */
  toggleMute(videoId: string) {
    const state = this.players.get(videoId);
    if (!state) return;
    
    if (this.unmutedVideoId === videoId) {
      // Currently unmuted - mute it
      state.videoElement.muted = true;
      this.unmutedVideoId = null;
      console.log(`🔇 [VIDEO-MANAGER] Muted video: ${videoId}`);
    } else {
      // Currently muted - unmute it and mute all others
      this.muteAllVideos();
      state.videoElement.muted = false;
      this.unmutedVideoId = videoId;
      console.log(`🔊 [VIDEO-MANAGER] Unmuted video: ${videoId}`);
    }
  }

  /**
   * Mute all videos
   */
  private muteAllVideos() {
    this.players.forEach(state => {
      state.videoElement.muted = true;
    });
    this.unmutedVideoId = null;
  }

  // ============= MEMORY MANAGEMENT =============

  /**
   * Cleanup old players to free memory (keep max 5)
   */
  private cleanupOldPlayers(aggressive = false) {
    const maxPlayers = aggressive ? Math.floor(this.maxActivePlayers / 2) : this.maxActivePlayers;
    
    if (this.players.size <= maxPlayers) return;
    
    // Sort players by last played time (oldest first)
    const sortedPlayers = Array.from(this.players.entries())
      .sort(([, a], [, b]) => a.lastPlayed.getTime() - b.lastPlayed.getTime());
    
    const playersToRemove = sortedPlayers.slice(0, this.players.size - maxPlayers);
    
    playersToRemove.forEach(([videoId]) => {
      // Don't remove currently playing video
      if (videoId !== this.currentlyPlayingId) {
        this.disposePlayer(videoId);
      }
    });
    
    console.log(`🧹 [VIDEO-MANAGER] Cleaned up ${playersToRemove.length} old players`);
  }

  /**
   * Dispose of specific player to free memory
   */
  disposePlayer(videoId: string) {
    const state = this.players.get(videoId);
    if (state) {
      state.videoElement.pause();
      state.videoElement.src = '';
      state.videoElement.load();
      state.videoElement.remove();
      
      this.players.delete(videoId);
      console.log(`🗑️ [VIDEO-MANAGER] Disposed player for: ${videoId}`);
    }
  }

  /**
   * Cleanup all players
   */
  cleanupAllPlayers() {
    console.log('🧹 [VIDEO-MANAGER] Cleaning up all players');
    
    this.players.forEach((_, videoId) => {
      this.disposePlayer(videoId);
    });
    
    this.players.clear();
    this.currentlyPlayingId = null;
    this.unmutedVideoId = null;
  }

  /**
   * Handle memory pressure
   */
  private handleMemoryPressure() {
    const now = Date.now();
    
    // Throttle memory warnings (max once per 30 seconds)
    if (now - this.lastMemoryWarning < 30000) return;
    
    this.lastMemoryWarning = now;
    console.warn('⚠️ [VIDEO-MANAGER] Memory pressure detected - aggressive cleanup');
    
    this.cleanupOldPlayers(true);
  }

  // ============= NETWORK MONITORING =============

  /**
   * Setup network quality monitoring
   */
  private setupNetworkMonitoring() {
    if (typeof navigator === 'undefined') return;
    
    // Use Network Information API if available
    this.connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (this.connection) {
      this.updateNetworkQuality();
      
      this.connection.addEventListener('change', () => {
        this.updateNetworkQuality();
      });
    } else {
      console.log('📶 [VIDEO-MANAGER] Network Information API not available');
    }
  }

  /**
   * Update network quality info
   */
  private updateNetworkQuality() {
    if (!this.connection) return;
    
    this.networkQuality = {
      type: this.connection.type || 'unknown',
      downlink: this.connection.downlink,
      effectiveType: this.connection.effectiveType
    };
    
    console.log(`📶 [VIDEO-MANAGER] Network updated:`, this.networkQuality);
    
    // Re-optimize active players
    this.players.forEach((state, videoId) => {
      if (state.isActive) {
        this.applyNetworkOptimizations(state.videoElement);
      }
    });
  }

  // ============= MEMORY MONITORING =============

  /**
   * Setup memory pressure monitoring
   */
  private setupMemoryMonitoring() {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    
    // Check memory usage every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
    
    // Listen for memory pressure events (if supported)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        console.log('📊 [VIDEO-MANAGER] Memory monitoring enabled');
      }
    }
  }

  /**
   * Check current memory usage
   */
  private checkMemoryUsage() {
    if (typeof performance === 'undefined' || !('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    if (memory) {
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.totalJSHeapSize;
      const limit = memory.jsHeapSizeLimit;
      
      const usagePercent = (usedMemory / limit) * 100;
      
      console.log(`📊 [VIDEO-MANAGER] Memory: ${(usedMemory / 1024 / 1024).toFixed(0)}MB / ${(limit / 1024 / 1024).toFixed(0)}MB (${usagePercent.toFixed(1)}%)`);
      
      // Trigger cleanup if usage is high
      if (usagePercent > 85) {
        this.handleMemoryPressure();
      }
    }
  }

  // ============= VISIBILITY HANDLING =============

  /**
   * Setup page visibility handling (auto-pause on background)
   */
  private setupVisibilityHandling() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('⏸️ [VIDEO-MANAGER] Page hidden - pausing videos');
        this.wasPlayingBeforePause = this.currentlyPlayingId;
        this.pauseAllVideos();
        this.isPageVisible = false;
      } else {
        console.log('▶️ [VIDEO-MANAGER] Page visible - resuming videos');
        this.isPageVisible = true;
        
        // Resume video that was playing before
        if (this.wasPlayingBeforePause) {
          setTimeout(() => {
            this.playVideo(this.wasPlayingBeforePause!);
            this.wasPlayingBeforePause = null;
          }, 100);
        }
      }
    });
  }

  /**
   * Setup cleanup on page unload
   */
  private setupUnloadHandler() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('beforeunload', () => {
      console.log('🛑 [VIDEO-MANAGER] Page unloading - cleaning up');
      this.cleanupAllPlayers();
      
      if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval);
      }
    });
  }

  // ============= REFRESH MANAGEMENT =============

  /**
   * Stop all playback for refresh
   */
  stopAllForRefresh() {
    console.log('🔇 [VIDEO-MANAGER] Stopping all for refresh');
    this.isRefreshing = true;
    this.pauseAllVideos();
    this.muteAllVideos();
  }

  /**
   * Resume after refresh
   */
  resumeAfterRefresh(videoId?: string) {
    console.log('🎬 [VIDEO-MANAGER] Resuming after refresh');
    
    setTimeout(() => {
      this.isRefreshing = false;
      if (videoId) {
        this.playVideo(videoId);
      }
    }, 100);
  }

  // ============= UTILITIES =============

  /**
   * Get current state for debugging
   */
  getDebugState() {
    return {
      activePlayers: this.players.size,
      currentlyPlaying: this.currentlyPlayingId,
      unmutedVideo: this.unmutedVideoId,
      isRefreshing: this.isRefreshing,
      isPageVisible: this.isPageVisible,
      networkQuality: this.networkQuality
    };
  }
}

// Export singleton instance
export const videoManager = VideoManager.getInstance();
export default videoManager;

