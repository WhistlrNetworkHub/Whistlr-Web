import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@lib/supabase/client';
import { Modal } from '@components/modal/modal';
import { MainHeader } from '@components/home/main-header';
import { UserCard } from '@components/user/user-card';
import { Loading } from '@components/ui/loading';
import type { User } from '@lib/types/user';

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

type FollowersModalProps = {
  open: boolean;
  closeModal: () => void;
  profileId: string;
  type: 'followers' | 'following';
  username: string;
};

// ✅ PAGINATION CONFIG (Matching iOS)
const PAGE_SIZE = 50; // Load 50 users at a time
const LOAD_THRESHOLD = 10; // Start loading next page when 10 items from bottom
const CACHE_TIMEOUT = 300000; // 5 minutes (like iOS)

// ✅ PROFILE CACHE (Matching iOS EnterpriseConnectionManager)
const profileCache = new Map<string, { users: User[]; timestamp: number }>();

export function FollowersModal({
  open,
  closeModal,
  profileId,
  type,
  username
}: FollowersModalProps): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);

  // ✅ CACHE KEY
  const cacheKey = `${type}-${profileId}`;

  // ✅ LOAD INITIAL PAGE (with cache check)
  const loadInitialPage = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    setCurrentPage(0);
    setHasMore(true);

    // Check cache first (iOS pattern)
    const cached = profileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      console.log('🚀 [CACHE HIT] Using cached data for', type);
      setUsers(cached.users);
      setLoading(false);
      return;
    }

    try {
      // ✅ OPTIMIZED: Use JOIN to fetch profiles directly (iOS pattern - avoids N+1)
      const query = supabase
        .from('follows')
        .select(
          type === 'followers'
            ? `
              follower_id,
              profiles!follows_follower_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified, 
                followers_count, following_count
              )
            `
            : `
              following_id,
              profiles!follows_following_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified,
                followers_count, following_count
              )
            `
        )
        .eq(type === 'followers' ? 'following_id' : 'follower_id', profileId)
        .range(0, PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) throw error;

      // ✅ Extract profiles from JOIN result
      const fetchedUsers = (data || [])
        .map((item: any) => item.profiles)
        .filter((profile: any) => profile !== null) as User[];

      console.log(`✅ [${type.toUpperCase()}] Loaded ${fetchedUsers.length} users (page 0)`);

      setUsers(fetchedUsers);
      setHasMore(fetchedUsers.length === PAGE_SIZE);

      // ✅ CACHE THE RESULT (iOS pattern)
      profileCache.set(cacheKey, {
        users: fetchedUsers,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Error loading ${type}:`, error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, type, cacheKey]);

  // ✅ LOAD NEXT PAGE (iOS pagination pattern)
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const query = supabase
        .from('follows')
        .select(
          type === 'followers'
            ? `
              follower_id,
              profiles!follows_follower_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified,
                followers_count, following_count
              )
            `
            : `
              following_id,
              profiles!follows_following_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified,
                followers_count, following_count
              )
            `
        )
        .eq(type === 'followers' ? 'following_id' : 'follower_id', profileId)
        .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) throw error;

      const newUsers = (data || [])
        .map((item: any) => item.profiles)
        .filter((profile: any) => profile !== null) as User[];

      console.log(`✅ [${type.toUpperCase()}] Loaded ${newUsers.length} more users (page ${nextPage})`);

      setUsers((prev) => [...prev, ...newUsers]);
      setCurrentPage(nextPage);
      setHasMore(newUsers.length === PAGE_SIZE);

      // Update cache
      profileCache.set(cacheKey, {
        users: [...users, ...newUsers],
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Error loading more ${type}:`, error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, currentPage, profileId, type, users, cacheKey]);

  // ✅ INTERSECTION OBSERVER for infinite scroll (iOS pattern)
  useEffect(() => {
    if (!open || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !loadingMore) {
          console.log('🔄 [PAGINATION] Loading next page...');
          loadNextPage();
        }
      },
      {
        root: scrollRef.current,
        rootMargin: `${LOAD_THRESHOLD * 80}px`, // 80px per item approx
        threshold: 0.1
      }
    );

    if (lastItemRef.current) {
      observer.observe(lastItemRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [open, hasMore, loading, loadingMore, loadNextPage]);

  // ✅ LOAD INITIAL PAGE when modal opens
  useEffect(() => {
    if (open && profileId) {
      setUsers([]); // Reset on type/profile change
      loadInitialPage();
    }
  }, [open, profileId, type, loadInitialPage]);

  return (
    <Modal
      className='flex items-center justify-center'
      modalClassName='relative rounded-2xl max-w-xl w-full h-[672px] overflow-hidden border border-white/10 shadow-2xl'
      open={open}
      closeModal={closeModal}
    >
      <div
        className='absolute inset-0 rounded-2xl'
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
      />
      <div className='relative z-10 h-full flex flex-col'>
        <MainHeader
          useActionButton
          className='border-b border-white/5'
          style={{
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          iconName='XMarkIcon'
          title={
            type === 'followers'
              ? `Followers${users.length > 0 ? ` (${users.length}${hasMore ? '+' : ''})` : ''}`
              : `Following${users.length > 0 ? ` (${users.length}${hasMore ? '+' : ''})` : ''}`
          }
          tip='Close'
          action={closeModal}
        />
        <section ref={scrollRef} className='flex-1 overflow-y-auto'>
          {loading ? (
            <Loading className='mt-20' />
          ) : users.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 px-8'>
              <p className='text-xl font-semibold text-white text-center'>
                {type === 'followers'
                  ? `@${username} doesn't have any followers yet`
                  : `@${username} isn't following anyone yet`}
              </p>
              <p className='text-white/60 text-sm mt-2 text-center'>
                {type === 'followers'
                  ? "When someone follows this account, they'll show up here."
                  : "When they follow someone, they'll show up here."}
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence mode='popLayout'>
                {users.map((user, index) => {
                  const isLastItem = index === users.length - 1;
                  return (
                    <motion.div
                      layout='position'
                      key={user.id}
                      {...variants}
                      ref={isLastItem ? lastItemRef : null}
                    >
                      <UserCard {...user} follow modal />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {loadingMore && (
                <div className='py-4 flex justify-center'>
                  <Loading />
                </div>
              )}
              {!hasMore && users.length > 0 && (
                <div className='py-8 text-center text-white/60 text-sm'>
                  That's everyone! 🎉
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}

import { supabase } from '@lib/supabase/client';
import { Modal } from '@components/modal/modal';
import { MainHeader } from '@components/home/main-header';
import { UserCard } from '@components/user/user-card';
import { Loading } from '@components/ui/loading';
import type { User } from '@lib/types/user';

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

type FollowersModalProps = {
  open: boolean;
  closeModal: () => void;
  profileId: string;
  type: 'followers' | 'following';
  username: string;
};

// ✅ PAGINATION CONFIG (Matching iOS)
const PAGE_SIZE = 50; // Load 50 users at a time
const LOAD_THRESHOLD = 10; // Start loading next page when 10 items from bottom
const CACHE_TIMEOUT = 300000; // 5 minutes (like iOS)

// ✅ PROFILE CACHE (Matching iOS EnterpriseConnectionManager)
const profileCache = new Map<string, { users: User[]; timestamp: number }>();

export function FollowersModal({
  open,
  closeModal,
  profileId,
  type,
  username
}: FollowersModalProps): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);

  // ✅ CACHE KEY
  const cacheKey = `${type}-${profileId}`;

  // ✅ LOAD INITIAL PAGE (with cache check)
  const loadInitialPage = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    setCurrentPage(0);
    setHasMore(true);

    // Check cache first (iOS pattern)
    const cached = profileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      console.log('🚀 [CACHE HIT] Using cached data for', type);
      setUsers(cached.users);
      setLoading(false);
      return;
    }

    try {
      // ✅ OPTIMIZED: Use JOIN to fetch profiles directly (iOS pattern - avoids N+1)
      const query = supabase
        .from('follows')
        .select(
          type === 'followers'
            ? `
              follower_id,
              profiles!follows_follower_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified, 
                followers_count, following_count
              )
            `
            : `
              following_id,
              profiles!follows_following_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified,
                followers_count, following_count
              )
            `
        )
        .eq(type === 'followers' ? 'following_id' : 'follower_id', profileId)
        .range(0, PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) throw error;

      // ✅ Extract profiles from JOIN result
      const fetchedUsers = (data || [])
        .map((item: any) => item.profiles)
        .filter((profile: any) => profile !== null) as User[];

      console.log(`✅ [${type.toUpperCase()}] Loaded ${fetchedUsers.length} users (page 0)`);

      setUsers(fetchedUsers);
      setHasMore(fetchedUsers.length === PAGE_SIZE);

      // ✅ CACHE THE RESULT (iOS pattern)
      profileCache.set(cacheKey, {
        users: fetchedUsers,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Error loading ${type}:`, error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, type, cacheKey]);

  // ✅ LOAD NEXT PAGE (iOS pagination pattern)
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const query = supabase
        .from('follows')
        .select(
          type === 'followers'
            ? `
              follower_id,
              profiles!follows_follower_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified,
                followers_count, following_count
              )
            `
            : `
              following_id,
              profiles!follows_following_id_fkey(
                id, username, full_name, avatar_url, bio, is_verified,
                followers_count, following_count
              )
            `
        )
        .eq(type === 'followers' ? 'following_id' : 'follower_id', profileId)
        .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) throw error;

      const newUsers = (data || [])
        .map((item: any) => item.profiles)
        .filter((profile: any) => profile !== null) as User[];

      console.log(`✅ [${type.toUpperCase()}] Loaded ${newUsers.length} more users (page ${nextPage})`);

      setUsers((prev) => [...prev, ...newUsers]);
      setCurrentPage(nextPage);
      setHasMore(newUsers.length === PAGE_SIZE);

      // Update cache
      profileCache.set(cacheKey, {
        users: [...users, ...newUsers],
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Error loading more ${type}:`, error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, currentPage, profileId, type, users, cacheKey]);

  // ✅ INTERSECTION OBSERVER for infinite scroll (iOS pattern)
  useEffect(() => {
    if (!open || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !loadingMore) {
          console.log('🔄 [PAGINATION] Loading next page...');
          loadNextPage();
        }
      },
      {
        root: scrollRef.current,
        rootMargin: `${LOAD_THRESHOLD * 80}px`, // 80px per item approx
        threshold: 0.1
      }
    );

    if (lastItemRef.current) {
      observer.observe(lastItemRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [open, hasMore, loading, loadingMore, loadNextPage]);

  // ✅ LOAD INITIAL PAGE when modal opens
  useEffect(() => {
    if (open && profileId) {
      setUsers([]); // Reset on type/profile change
      loadInitialPage();
    }
  }, [open, profileId, type, loadInitialPage]);

  return (
    <Modal
      className='flex items-center justify-center'
      modalClassName='relative rounded-2xl max-w-xl w-full h-[672px] overflow-hidden border border-white/10 shadow-2xl'
      open={open}
      closeModal={closeModal}
    >
      <div
        className='absolute inset-0 rounded-2xl'
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
      />
      <div className='relative z-10 h-full flex flex-col'>
        <MainHeader
          useActionButton
          className='border-b border-white/5'
          style={{
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          iconName='XMarkIcon'
          title={
            type === 'followers'
              ? `Followers${users.length > 0 ? ` (${users.length}${hasMore ? '+' : ''})` : ''}`
              : `Following${users.length > 0 ? ` (${users.length}${hasMore ? '+' : ''})` : ''}`
          }
          tip='Close'
          action={closeModal}
        />
        <section ref={scrollRef} className='flex-1 overflow-y-auto'>
          {loading ? (
            <Loading className='mt-20' />
          ) : users.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 px-8'>
              <p className='text-xl font-semibold text-white text-center'>
                {type === 'followers'
                  ? `@${username} doesn't have any followers yet`
                  : `@${username} isn't following anyone yet`}
              </p>
              <p className='text-white/60 text-sm mt-2 text-center'>
                {type === 'followers'
                  ? "When someone follows this account, they'll show up here."
                  : "When they follow someone, they'll show up here."}
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence mode='popLayout'>
                {users.map((user, index) => {
                  const isLastItem = index === users.length - 1;
                  return (
                    <motion.div
                      layout='position'
                      key={user.id}
                      {...variants}
                      ref={isLastItem ? lastItemRef : null}
                    >
                      <UserCard {...user} follow modal />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {loadingMore && (
                <div className='py-4 flex justify-center'>
                  <Loading />
                </div>
              )}
              {!hasMore && users.length > 0 && (
                <div className='py-8 text-center text-white/60 text-sm'>
                  That's everyone! 🎉
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}


