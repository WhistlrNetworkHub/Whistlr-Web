import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@lib/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { Loading } from '@components/ui/loading';
import { HeroIcon } from '@components/ui/hero-icon';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

interface SearchPost {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[] | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

export default function Search(): JSX.Element {
  const router = useRouter();
  const { q } = router.query;
  const searchQuery = typeof q === 'string' ? q : '';

  const [selectedCategory, setSelectedCategory] = useState<"Mini's" | 'Imprints' | 'Whistles' | 'Creators'>("Mini's");
  const [searchText, setSearchText] = useState(searchQuery);
  const [results, setResults] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);

  const categories: Array<"Mini's" | 'Imprints' | 'Whistles' | 'Creators'> = ["Mini's", 'Imprints', 'Whistles', 'Creators'];

  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchText) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchText, selectedCategory]);

  const performSearch = async () => {
    if (!searchText.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from('posts')
        .select(`
          id, author_id, content, media_urls, media_type, likes_count, comments_count, created_at,
          user:author_id(id, username, full_name, avatar_url, is_verified)
        `);

      // Filter based on category
      switch (selectedCategory) {
        case "Mini's":
          query = query.eq('media_type', 'video');
          break;
        case 'Imprints':
          query = query.eq('media_type', 'image');
          break;
        case 'Whistles':
          query = query.is('media_urls', null);
          break;
        case 'Creators':
          // For creators, we'll query profiles instead
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_verified, followers_count')
            .or(`username.ilike.%${searchText}%,full_name.ilike.%${searchText}%`)
            .not('avatar_url', 'is', null)
            .order('followers_count', { ascending: false })
            .limit(20);

          const formattedProfiles = (profileData || []).map(profile => ({
            id: profile.id,
            author_id: profile.id,
            content: '',
            media_urls: null,
            media_type: 'creator',
            likes_count: 0,
            comments_count: 0,
            created_at: new Date().toISOString(),
            user: {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              is_verified: profile.is_verified
            }
          }));

          setResults(formattedProfiles as SearchPost[]);
          setLoading(false);
          return;
      }

      // Add content search filter
      query = query.or(`content.ilike.%${searchText}%,content.ilike.%${searchText.replace('#', '')}%`);
      query = query.order('created_at', { ascending: false }).limit(50);

      const { data } = await query;

      setResults((data as SearchPost[]) || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getFullImageURL = (url: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) {
      // Fix the domain if needed
      return url.replace('phdgiqhcirgddxwgxpxy', 'phdgiqhcidqnfuwxszco');
    }
    // Construct the full URL
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/${url}`;
  };

  return (
    <MainContainer>
      <SEO title={`Search${searchQuery ? `: ${searchQuery}` : ''} / Whistlr`} />
      
      {/* TikTok-Style Search Header */}
      <div className='sticky top-0 z-10 glass-morphism-strong border-b border-white/5 px-4 py-4'>
        <div className='flex items-center gap-3'>
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className='flex items-center justify-center w-9 h-9 rounded-full glass-morphism hover:bg-white/10 transition-all duration-200'
          >
            <HeroIcon iconName='ChevronLeftIcon' className='h-5 w-5 text-white' />
          </button>

          {/* Search Bar with Gradient Border */}
          <form onSubmit={handleSearchSubmit} className='flex-1 relative group'>
            <div className='relative'>
              {/* Animated Gradient Border */}
              <div className='absolute -inset-[1px] rounded-[22px] bg-gradient-to-br from-cyan-400 via-blue-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 blur-sm transition-all duration-300' />
              
              {/* Search Input Container */}
              <div className='relative flex items-center gap-3 px-4 py-2.5 glass-morphism-light rounded-[22px] border border-white/10 backdrop-blur-xl shadow-2xl'>
                <HeroIcon iconName='MagnifyingGlassIcon' className='h-4 w-4 text-white/70 flex-shrink-0' />
                <input
                  type='text'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder='Search Whistlr'
                  className='flex-1 bg-transparent text-white placeholder:text-white/60 outline-none text-sm font-medium'
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                />
                {searchText && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchText('');
                      setResults([]);
                    }}
                    className='flex-shrink-0 w-5 h-5 rounded-full glass-morphism hover:bg-white/10 flex items-center justify-center transition-all duration-200'
                  >
                    <HeroIcon iconName='XMarkIcon' className='h-3.5 w-3.5 text-white/70' />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* More Options */}
          <button className='flex items-center justify-center w-9 h-9 rounded-full glass-morphism hover:bg-white/10 transition-all duration-200'>
            <HeroIcon iconName='EllipsisHorizontalIcon' className='h-5 w-5 text-white' />
          </button>
        </div>
      </div>

      {/* Category Tabs (TikTok Style) */}
      <div className='flex items-center justify-around px-4 py-1 border-b border-white/5'>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className='relative flex flex-col items-center gap-2 py-3 px-2 transition-all duration-200'
          >
            <span 
              className={`text-base transition-all duration-200 ${
                selectedCategory === category
                  ? 'text-white font-semibold'
                  : 'text-white/50 font-medium hover:text-white/70'
              }`}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            >
              {category}
            </span>
            <motion.div 
              className='h-[2px] w-full rounded-full'
              animate={{
                backgroundColor: selectedCategory === category ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)',
                boxShadow: selectedCategory === category ? '0 0 8px rgba(255, 255, 255, 0.5)' : '0 0 0 rgba(255, 255, 255, 0)'
              }}
              transition={{ duration: 0.3 }}
            />
          </button>
        ))}
      </div>

      {/* Search Results */}
      <div className='px-4 py-6'>
        {loading ? (
          <Loading className='mt-10' />
        ) : !searchText ? (
          <div className='flex flex-col items-center justify-center py-20'>
            <HeroIcon iconName='MagnifyingGlassIcon' className='h-12 w-12 text-white/40 mb-4' />
            <p className='text-lg font-semibold text-white'>Search Whistlr</p>
            <p className='text-sm text-white/70 mt-2'>Find posts, creators, and more</p>
          </div>
        ) : results.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20'>
            <HeroIcon iconName='MagnifyingGlassIcon' className='h-12 w-12 text-white/40 mb-4' />
            <p className='text-lg font-semibold text-white'>No results found</p>
            <p className='text-sm text-white/70 mt-2'>Try searching for something else</p>
          </div>
        ) : (
          <>
            {/* Featured Section - Horizontal Scroll */}
            {results.length > 0 && (
              <div className='mb-8'>
                <div className='flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide'>
                  {results.slice(0, 4).map((post, index) => (
                    <Link key={post.id} href={selectedCategory === 'Creators' ? `/user/${post.user?.id}` : `/tweet/${post.id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className='relative flex-shrink-0 w-[200px] h-[280px] rounded-[24px] overflow-hidden cursor-pointer shadow-2xl'
                      >
                        {/* Background Image */}
                        <div className='absolute inset-0'>
                          {post.user?.avatar_url && selectedCategory === 'Creators' ? (
                            <img
                              src={getFullImageURL(post.user.avatar_url)}
                              alt={post.user.username}
                              className='w-full h-full object-cover'
                            />
                          ) : post.media_urls && post.media_urls[0] ? (
                            <img
                              src={getFullImageURL(post.media_urls[0])}
                              alt='Post media'
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <div className='w-full h-full bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700' />
                          )}
                        </div>

                        {/* Premium Gradient Overlay */}
                        <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80' />

                        {/* Border Glow */}
                        <div className='absolute inset-0 rounded-[24px] border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]' />

                        {/* Text Content */}
                        <div className='absolute inset-0 p-4 flex flex-col justify-between'>
                          <div className='inline-flex items-center px-3 py-1 rounded-full glass-morphism-strong border border-white/20 self-start'>
                            <span className='text-[10px] font-bold text-white uppercase tracking-wider'>
                              Featured
                            </span>
                          </div>
                          
                          <div className='space-y-1.5'>
                            {post.content && selectedCategory !== 'Creators' ? (
                              <p className='text-[13px] font-bold text-white line-clamp-2 drop-shadow-lg' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                                {post.content}
                              </p>
                            ) : (
                              <p className='text-[13px] font-bold text-white drop-shadow-lg' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                                @{post.user?.username}
                              </p>
                            )}
                            <p className='text-[10px] font-semibold text-white/90 drop-shadow-md' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                              by @{post.user?.username}
                            </p>
                            <p className='text-[9px] font-medium text-white/80 drop-shadow-md' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                              {formatCount(post.likes_count)} whistles
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Top Section Title */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-[26px] font-bold text-white tracking-tight' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                Top {selectedCategory}
              </h2>
              <button className='w-9 h-9 rounded-full glass-morphism hover:bg-white/10 flex items-center justify-center transition-all duration-200'>
                <HeroIcon iconName='ArrowPathIcon' className='h-5 w-5 text-white/70' />
              </button>
            </div>

            {/* Results Grid */}
            {selectedCategory === 'Whistles' ? (
              /* List layout for Whistles */
              <div className='space-y-3'>
                {results.map((post, index) => (
                  <Link key={post.id} href={`/tweet/${post.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className='p-5 rounded-2xl glass-morphism-light border border-white/10 hover:border-white/20 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200'
                    >
                      {/* Header */}
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='relative'>
                          <img
                            src={getFullImageURL(post.user?.avatar_url || '')}
                            alt={post.user?.username}
                            className='w-11 h-11 rounded-full object-cover ring-2 ring-white/10'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/default-avatar.png';
                            }}
                          />
                          {post.user?.is_verified && (
                            <div className='absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center'>
                              <HeroIcon iconName='CheckIcon' className='h-2.5 w-2.5 text-white' />
                            </div>
                          )}
                        </div>
                        <div className='flex-1'>
                          <p className='text-base font-semibold text-white' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                            @{post.user?.username}
                          </p>
                          <p className='text-xs text-white/50 font-medium'>2h</p>
                        </div>
                        <button className='w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-all'>
                          <HeroIcon iconName='EllipsisHorizontalIcon' className='h-4 w-4 text-white/60' />
                        </button>
                      </div>

                      {/* Content */}
                      {post.content && (
                        <p className='text-[15px] text-white/95 mb-4 line-clamp-3 leading-relaxed' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                          {post.content}
                        </p>
                      )}

                      {/* Engagement */}
                      <div className='flex items-center gap-6'>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-4 text-blue-400'>♪</div>
                          <span className='text-sm text-white/70 font-medium'>
                            {formatCount(post.likes_count)}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <HeroIcon iconName='ChatBubbleLeftIcon' className='h-4 w-4 text-white/60' />
                          <span className='text-sm text-white/70 font-medium'>
                            {formatCount(post.comments_count)}
                          </span>
                        </div>
                        <div className='flex items-center gap-2 ml-auto'>
                          <HeroIcon iconName='ArrowPathRoundedSquareIcon' className='h-4 w-4 text-white/60' />
                          <HeroIcon iconName='ShareIcon' className='h-4 w-4 text-white/60' />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : selectedCategory === 'Creators' ? (
              /* Grid layout for Creators */
              <div className='grid grid-cols-2 gap-3'>
                {results.map((post, index) => (
                  <Link key={post.id} href={`/user/${post.user?.id}`}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      className='relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-200'
                    >
                      {/* Background */}
                      <div className='absolute inset-0'>
                        {post.user?.avatar_url ? (
                          <img
                            src={getFullImageURL(post.user.avatar_url)}
                            alt={post.user.username}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600' />
                        )}
                      </div>

                      {/* Premium Gradient Overlay */}
                      <div className='absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/75' />

                      {/* Border Glow */}
                      <div className='absolute inset-0 rounded-2xl border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.1)]' />

                      {/* Text */}
                      <div className='absolute inset-0 p-4 flex flex-col justify-end'>
                        <div className='inline-flex items-center px-2.5 py-1 rounded-full glass-morphism-strong border border-white/20 self-start mb-2'>
                          <span className='text-[10px] font-bold text-white/95 uppercase tracking-wider'>
                            Creator
                          </span>
                        </div>
                        <p className='text-lg font-bold text-white drop-shadow-lg' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                          @{post.user?.username}
                        </p>
                        {post.user?.is_verified && (
                          <div className='flex items-center gap-1 mt-1'>
                            <div className='w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center'>
                              <HeroIcon iconName='CheckIcon' className='h-2 w-2 text-white' />
                            </div>
                            <span className='text-xs text-white/90 font-medium'>Verified</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Grid layout for Mini's and Imprints */
              <div className='grid grid-cols-2 gap-3'>
                {results.map((post, index) => (
                  <Link key={post.id} href={`/tweet/${post.id}`}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      className='relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-200'
                    >
                      {/* Media */}
                      {post.media_urls && post.media_urls[0] ? (
                        selectedCategory === "Mini's" ? (
                          <video
                            src={getFullImageURL(post.media_urls[0])}
                            className='w-full h-full object-cover'
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={getFullImageURL(post.media_urls[0])}
                            alt='Post media'
                            className='w-full h-full object-cover'
                          />
                        )
                      ) : (
                        <div className='w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500' />
                      )}

                      {/* Border Glow */}
                      <div className='absolute inset-0 rounded-xl border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' />

                      {/* Likes Badge */}
                      <div className='absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass-morphism-strong border border-white/20 backdrop-blur-xl shadow-lg'>
                        <div className='w-2.5 h-2.5 text-blue-400'>♪</div>
                        <span className='text-[11px] font-bold text-white'>
                          {formatCount(post.likes_count)}
                        </span>
                      </div>

                      {/* Content Overlay */}
                      {post.content && (
                        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3'>
                          <p className='text-xs font-semibold text-white line-clamp-2 drop-shadow-lg' style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                            {post.content}
                          </p>
                        </div>
                      )}

                      {/* Play Icon for Videos */}
                      {selectedCategory === "Mini's" && (
                        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                          <div className='w-12 h-12 rounded-full glass-morphism-strong border border-white/30 flex items-center justify-center shadow-2xl'>
                            <HeroIcon iconName='PlayIcon' className='h-6 w-6 text-white ml-1' />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MainContainer>
  );
}

Search.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
