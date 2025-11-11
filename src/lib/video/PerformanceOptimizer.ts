/**
 * PerformanceOptimizer.ts
 * Optimizes performance for low-end devices and long sessions
 * Based on iOS PerformanceOptimizer with web-specific adaptations
 * 
 * FEATURES:
 * - Device tier detection (low/mid/high-end)
 * - Long session stability (20+ minutes)
 * - Memory leak detection and prevention
 * - Adaptive configuration based on device capabilities
 * - Low Power Mode detection (battery saver)
 */

export enum DeviceTier {
  LOW_END = 'low-end',    // < 4GB RAM, old devices
  MID_TIER = 'mid-tier',  // 4-8GB RAM
  HIGH_END = 'high-end',  // 8GB+ RAM
  UNKNOWN = 'unknown'
}

export interface InitStrategy {
  prefetchDistance: number;
  imagePrefetchCount: number;
  videoPrefetchCount: number;
  enableAggressiveCaching: boolean;
  maxConcurrentVideoPlayers: number;
  enableRealtimeThrottling: boolean;
}

export interface PerformanceMetrics {
  sessionDuration: number;
  totalVideosPlayed: number;
  totalCommentsSubmitted: number;
  currentMemoryUsage: number;
  peakMemoryUsage: number;
  memoryLeakDetected: boolean;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  
  // Device capabilities
  private deviceTier: DeviceTier = DeviceTier.UNKNOWN;
  private isLowPowerMode = false;
  private deviceMemory: number = 4; // Default 4GB
  private hardwareConcurrency: number = 4; // Default 4 cores
  
  // Session tracking
  private sessionStartTime: Date | null = null;
  private totalVideosPlayed = 0;
  private totalCommentsSubmitted = 0;
  private lastMemoryCheck = Date.now();
  private memoryLeakDetected = false;
  
  // Performance metrics
  private currentMemoryUsage = 0;
  private peakMemoryUsage = 0;
  private sessionDuration = 0;
  
  // Cleanup intervals
  private periodicCleanupInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      this.detectDeviceTier();
      this.setupPerformanceMonitoring();
      console.log(`🎯 [PERFORMANCE-OPTIMIZER] Initialized for ${this.deviceTier} device`);
    }
  }

  static getInstance(): PerformanceOptimizer {
    // Only create instance in browser environment
    if (typeof window === 'undefined') {
      // Return a mock instance for SSR with default values
      return {
        getOptimizedInitStrategy: () => ({
          prefetchDistance: 4,
          imagePrefetchCount: 8,
          videoPrefetchCount: 2,
          enableAggressiveCaching: true,
          maxConcurrentVideoPlayers: 3,
          enableRealtimeThrottling: false
        }),
        startSession: () => {},
        trackVideoPlay: () => {},
        trackCommentSubmission: () => {},
        getPerformanceMetrics: () => ({
          sessionDuration: 0,
          totalVideosPlayed: 0,
          totalCommentsSubmitted: 0,
          currentMemoryUsage: 0,
          peakMemoryUsage: 0,
          memoryLeakDetected: false
        }),
        getPerformanceReport: () => 'SSR Mode',
        getDeviceTier: () => DeviceTier.UNKNOWN,
        isLowPower: () => false,
        destroy: () => {}
      } as PerformanceOptimizer;
    }
    
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // ============= DEVICE DETECTION =============

  /**
   * Detect device tier based on hardware
   */
  private detectDeviceTier() {
    if (typeof navigator === 'undefined') {
      this.deviceTier = DeviceTier.UNKNOWN;
      return;
    }
    
    // Get device memory (GB)
    this.deviceMemory = (navigator as any).deviceMemory || 4;
    
    // Get hardware concurrency (CPU cores)
    this.hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    // Classify device tier
    if (this.deviceMemory < 4) {
      this.deviceTier = DeviceTier.LOW_END;
      console.log('📱 [PERFORMANCE] Low-end device detected - enabling aggressive optimizations');
    } else if (this.deviceMemory >= 4 && this.deviceMemory < 8) {
      this.deviceTier = DeviceTier.MID_TIER;
      console.log('📱 [PERFORMANCE] Mid-tier device detected - balanced mode');
    } else if (this.deviceMemory >= 8) {
      this.deviceTier = DeviceTier.HIGH_END;
      console.log('📱 [PERFORMANCE] High-end device detected - full performance mode');
    } else {
      this.deviceTier = DeviceTier.UNKNOWN;
    }
    
    // Detect battery saver / low power mode
    this.detectLowPowerMode();
    
    console.log(`📊 [PERFORMANCE] Device: ${this.deviceMemory}GB RAM, ${this.hardwareConcurrency} cores`);
  }

  /**
   * Detect low power mode (battery saver)
   */
  private detectLowPowerMode() {
    if (typeof navigator === 'undefined') return;
    
    // Check for Battery Status API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        // Consider low power mode if battery is low and not charging
        const isLowBattery = battery.level < 0.2;
        const isCharging = battery.charging;
        
        this.isLowPowerMode = isLowBattery && !isCharging;
        
        if (this.isLowPowerMode) {
          console.log('🔋 [PERFORMANCE] Low Power Mode detected - reducing performance');
        }
        
        // Listen for battery changes
        battery.addEventListener('levelchange', () => {
          const wasLowPower = this.isLowPowerMode;
          this.isLowPowerMode = battery.level < 0.2 && !battery.charging;
          
          if (this.isLowPowerMode && !wasLowPower) {
            console.log('🔋 [PERFORMANCE] Entering Low Power Mode');
            this.handleLowPowerModeChange(true);
          } else if (!this.isLowPowerMode && wasLowPower) {
            console.log('🔋 [PERFORMANCE] Exiting Low Power Mode');
            this.handleLowPowerModeChange(false);
          }
        });
      });
    }
  }

  /**
   * Handle low power mode changes
   */
  private handleLowPowerModeChange(enabled: boolean) {
    if (enabled) {
      // Reduce performance
      this.performMemoryCleanup();
    } else {
      // Restore performance - do nothing, let normal optimization kick in
    }
  }

  // ============= OPTIMIZATION STRATEGY =============

  /**
   * Get optimized initialization strategy based on device tier
   */
  getOptimizedInitStrategy(): InitStrategy {
    // Adjust based on low power mode
    const powerModifier = this.isLowPowerMode ? 0.5 : 1.0;
    
    switch (this.deviceTier) {
      case DeviceTier.LOW_END:
        return {
          prefetchDistance: Math.floor(2 * powerModifier),
          imagePrefetchCount: Math.floor(3 * powerModifier),
          videoPrefetchCount: 1,
          enableAggressiveCaching: false,
          maxConcurrentVideoPlayers: 2,
          enableRealtimeThrottling: true
        };
      
      case DeviceTier.MID_TIER:
        return {
          prefetchDistance: Math.floor(4 * powerModifier),
          imagePrefetchCount: Math.floor(8 * powerModifier),
          videoPrefetchCount: 2,
          enableAggressiveCaching: true,
          maxConcurrentVideoPlayers: 3,
          enableRealtimeThrottling: false
        };
      
      case DeviceTier.HIGH_END:
      case DeviceTier.UNKNOWN:
      default:
        return {
          prefetchDistance: Math.floor(8 * powerModifier),
          imagePrefetchCount: Math.floor(15 * powerModifier),
          videoPrefetchCount: 3,
          enableAggressiveCaching: true,
          maxConcurrentVideoPlayers: 5,
          enableRealtimeThrottling: false
        };
    }
  }

  // ============= SESSION MANAGEMENT =============

  /**
   * Start performance tracking session
   */
  startSession() {
    this.sessionStartTime = new Date();
    this.totalVideosPlayed = 0;
    this.totalCommentsSubmitted = 0;
    this.peakMemoryUsage = 0;
    this.memoryLeakDetected = false;
    
    console.log('🎬 [PERFORMANCE] Session started - monitoring for leaks');
    
    // Start periodic cleanup for long sessions
    this.startPeriodicCleanup();
  }

  /**
   * Track video play (cleanup every 10 videos)
   */
  trackVideoPlay() {
    this.totalVideosPlayed++;
    
    // Cleanup every 10 videos
    if (this.totalVideosPlayed % 10 === 0) {
      console.log(`🧹 [PERFORMANCE] Played ${this.totalVideosPlayed} videos - running cleanup`);
      this.performMemoryCleanup();
    }
  }

  /**
   * Track comment submission (cleanup every 50 comments)
   */
  trackCommentSubmission() {
    this.totalCommentsSubmitted++;
    
    // Cleanup every 50 comments
    if (this.totalCommentsSubmitted % 50 === 0) {
      console.log(`🧹 [PERFORMANCE] Submitted ${this.totalCommentsSubmitted} comments - clearing stale caches`);
      this.clearStaleCaches();
    }
  }

  /**
   * Start periodic cleanup (every 5 minutes)
   */
  private startPeriodicCleanup() {
    // Clear any existing interval
    if (this.periodicCleanupInterval) {
      clearInterval(this.periodicCleanupInterval);
    }
    
    // Run cleanup every 5 minutes
    this.periodicCleanupInterval = setInterval(() => {
      this.performPeriodicMaintenance();
    }, 300000); // 5 minutes
  }

  /**
   * Perform periodic maintenance
   */
  private performPeriodicMaintenance() {
    if (!this.sessionStartTime) return;
    
    this.sessionDuration = (Date.now() - this.sessionStartTime.getTime()) / 1000;
    
    console.log(`🔧 [PERFORMANCE] Periodic maintenance - Session: ${(this.sessionDuration / 60).toFixed(1)}min`);
    
    // 1. Check memory usage
    this.checkMemoryUsage();
    
    // 2. Detect memory leaks
    this.detectMemoryLeaks();
    
    // 3. Cleanup old resources
    this.performMemoryCleanup();
    
    // 4. Report status
    this.logPerformanceStatus();
  }

  /**
   * Check current memory usage
   */
  private checkMemoryUsage() {
    if (typeof performance === 'undefined' || !('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    if (memory) {
      this.currentMemoryUsage = memory.usedJSHeapSize;
      
      if (this.currentMemoryUsage > this.peakMemoryUsage) {
        this.peakMemoryUsage = this.currentMemoryUsage;
      }
    }
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks() {
    // Expected memory: 200MB base + 5MB per video
    const expectedMemory = 200_000_000 + (this.totalVideosPlayed * 5_000_000);
    
    if (this.currentMemoryUsage > expectedMemory * 2) {
      console.warn('⚠️ [PERFORMANCE] Possible memory leak detected - forcing cleanup');
      this.memoryLeakDetected = true;
      this.performAggressiveCleanup();
    }
  }

  /**
   * Perform memory cleanup
   */
  private performMemoryCleanup() {
    console.log('🧹 [PERFORMANCE] Running memory cleanup');
    
    // Import managers dynamically to avoid circular dependencies
    import('./VideoManager').then(({ videoManager }) => {
      videoManager.cleanupOldPlayers();
    });
    
    console.log('✅ [PERFORMANCE] Memory cleanup complete');
  }

  /**
   * Perform aggressive cleanup (for memory leaks)
   */
  private performAggressiveCleanup() {
    console.warn('🚨 [PERFORMANCE] AGGRESSIVE CLEANUP - Leak mitigation');
    
    // 1. Clear all caches
    this.performMemoryCleanup();
    
    // 2. Clear localStorage old data
    this.clearStaleCaches();
    
    // 3. Reduce prefetch thresholds
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('performance_degraded_mode', 'true');
    }
    
    console.log('✅ [PERFORMANCE] Aggressive cleanup complete - performance degraded mode active');
  }

  /**
   * Clear stale caches
   */
  private clearStaleCaches() {
    // Clear old localStorage items
    if (typeof window !== 'undefined') {
      const storage = window.localStorage;
      const now = Date.now();
      
      // Clear items older than 24 hours
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith('cache_')) {
          try {
            const item = JSON.parse(storage.getItem(key) || '{}');
            if (item.timestamp && now - item.timestamp > 86400000) {
              storage.removeItem(key);
            }
          } catch (e) {
            // Invalid JSON, remove it
            storage.removeItem(key);
          }
        }
      }
    }
    
    console.log('🧹 [PERFORMANCE] Stale caches cleared');
  }

  /**
   * Log performance status
   */
  private logPerformanceStatus() {
    console.log(`
📊 [PERFORMANCE] Session Health:
   Duration: ${(this.sessionDuration / 60).toFixed(1)}min
   Videos: ${this.totalVideosPlayed}
   Comments: ${this.totalCommentsSubmitted}
   Memory: ${this.formatBytes(this.currentMemoryUsage)} / ${this.formatBytes(this.peakMemoryUsage)} peak
   Leak Detected: ${this.memoryLeakDetected ? '⚠️ YES' : '✅ NO'}
    `);
  }

  // ============= PERFORMANCE MONITORING =============

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring() {
    if (typeof performance === 'undefined') return;
    
    // Monitor memory warnings if supported
    if ('memory' in performance) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // Check every 30 seconds
    }
  }

  // ============= UTILITIES =============

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      sessionDuration: this.sessionDuration,
      totalVideosPlayed: this.totalVideosPlayed,
      totalCommentsSubmitted: this.totalCommentsSubmitted,
      currentMemoryUsage: this.currentMemoryUsage,
      peakMemoryUsage: this.peakMemoryUsage,
      memoryLeakDetected: this.memoryLeakDetected
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const strategy = this.getOptimizedInitStrategy();
    
    return `
🎯 PERFORMANCE REPORT

Device Tier: ${this.deviceTier}
Low Power Mode: ${this.isLowPowerMode ? '🔋 ON' : 'OFF'}
Memory: ${this.deviceMemory}GB
CPU Cores: ${this.hardwareConcurrency}

Session:
- Duration: ${(this.sessionDuration / 60).toFixed(1)} minutes
- Videos Played: ${this.totalVideosPlayed}
- Comments Submitted: ${this.totalCommentsSubmitted}

Memory:
- Current: ${this.formatBytes(this.currentMemoryUsage)}
- Peak: ${this.formatBytes(this.peakMemoryUsage)}
- Leak Detected: ${this.memoryLeakDetected ? '⚠️ YES' : '✅ NO'}

Optimizations:
- Prefetch Distance: ${strategy.prefetchDistance} posts
- Max Video Players: ${strategy.maxConcurrentVideoPlayers}
- Aggressive Caching: ${strategy.enableAggressiveCaching ? 'ON' : 'OFF'}
- Realtime Throttling: ${strategy.enableRealtimeThrottling ? 'ON' : 'OFF'}
    `.trim();
  }

  /**
   * Get device tier
   */
  getDeviceTier(): DeviceTier {
    return this.deviceTier;
  }

  /**
   * Is low power mode enabled
   */
  isLowPower(): boolean {
    return this.isLowPowerMode;
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.periodicCleanupInterval) {
      clearInterval(this.periodicCleanupInterval);
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
export default performanceOptimizer;

