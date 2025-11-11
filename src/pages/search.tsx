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
      <div className='sticky top-0 z-10 glass-morphism-strong px-4 py-3'>
        <div className='flex items-center gap-3'>
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className='flex items-center justify-center hover:opacity-80 transition-opacity'
          >
            <HeroIcon iconName='ChevronLeftIcon' className='h-5 w-5 text-white' />
          </button>

          {/* Search Bar with Gradient Border */}
          <form onSubmit={handleSearchSubmit} className='flex-1 relative'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-[20px] bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 opacity-80 blur-[2px]' />
              <div className='relative flex items-center gap-2 px-4 py-2 bg-transparent rounded-[20px] border-2 border-transparent' style={{
                borderImage: 'linear-gradient(135deg, cyan, blue, purple, pink) 1'
              }}>
                <HeroIcon iconName='MagnifyingGlassIcon' className='h-4 w-4 text-white/70' />
                <input
                  type='text'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder='Search'
                  className='flex-1 bg-transparent text-white placeholder:text-white/70 outline-none text-sm'
                />
                {searchText && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchText('');
                      setResults([]);
                    }}
                    className='hover:opacity-80 transition-opacity'
                  >
                    <HeroIcon iconName='XMarkIcon' className='h-4 w-4 text-white/70' />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* More Options */}
          <button className='flex items-center justify-center hover:opacity-80 transition-opacity'>
            <HeroIcon iconName='EllipsisHorizontalIcon' className='h-5 w-5 text-white' />
          </button>
        </div>
      </div>

      {/* Category Tabs (TikTok Style) */}
      <div className='flex items-center justify-around px-4 pb-4 border-b border-white/10'>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className='flex flex-col items-center gap-2 py-2'
          >
            <span className={`text-base transition-all ${
              selectedCategory === category
                ? 'text-white font-semibold'
                : 'text-white/60 font-medium'
            }`}>
              {category}
            </span>
            <div className={`h-0.5 w-full transition-all ${
              selectedCategory === category
                ? 'bg-white'
                : 'bg-transparent'
            }`} />
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
              <div className='mb-6'>
                <div className='flex gap-4 overflow-x-auto pb-4 scrollbar-hide'>
                  {results.slice(0, 4).map((post) => (
                    <Link key={post.id} href={selectedCategory === 'Creators' ? `/user/${post.user?.id}` : `/tweet/${post.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className='relative flex-shrink-0 w-[200px] h-[280px] rounded-[20px] overflow-hidden cursor-pointer'
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
                            <div className='w-full h-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600' />
                          )}
                        </div>

                        {/* Gradient Overlay */}
                        <div className='absolute inset-0 bg-gradient-to-b from-transparent to-black/70' />

                        {/* Text Content */}
                        <div className='absolute inset-0 p-4 flex flex-col justify-between'>
                          <span className='text-xs font-semibold text-white/90 uppercase'>
                            Featured
                          </span>
                          
                          <div className='space-y-1'>
                            {post.content && selectedCategory !== 'Creators' ? (
                              <p className='text-sm font-bold text-white line-clamp-2'>
                                {post.content}
                              </p>
                            ) : (
                              <p className='text-sm font-bold text-white'>
                                @{post.user?.username}
                              </p>
                            )}
                            <p className='text-xs font-medium text-white/80'>
                              by @{post.user?.username}
                            </p>
                            <p className='text-xs font-medium text-white/80'>
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
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-bold text-white'>
                Top {selectedCategory}
              </h2>
              <button className='hover:opacity-80 transition-opacity'>
                <HeroIcon iconName='ArrowPathIcon' className='h-5 w-5 text-white/70' />
              </button>
            </div>

            {/* Results Grid */}
            {selectedCategory === 'Whistles' ? (
              /* List layout for Whistles */
              <div className='space-y-2'>
                {results.map((post) => (
                  <Link key={post.id} href={`/tweet/${post.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className='p-4 rounded-xl glass-morphism-light border border-white/10 cursor-pointer'
                    >
                      {/* Header */}
                      <div className='flex items-center gap-3 mb-3'>
                        <img
                          src={getFullImageURL(post.user?.avatar_url || '')}
                          alt={post.user?.username}
                          className='w-10 h-10 rounded-full object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default-avatar.png';
                          }}
                        />
                        <div className='flex-1'>
                          <p className='text-base font-semibold text-white'>
                            @{post.user?.username}
                          </p>
                          <p className='text-sm text-white/60'>2h</p>
                        </div>
                        <button className='hover:opacity-80'>
                          <HeroIcon iconName='EllipsisHorizontalIcon' className='h-5 w-5 text-white/70' />
                        </button>
                      </div>

                      {/* Content */}
                      {post.content && (
                        <p className='text-base text-white mb-3 line-clamp-3'>
                          {post.content}
                        </p>
                      )}

                      {/* Engagement */}
                      <div className='flex items-center gap-5'>
                        <div className='flex items-center gap-2'>
                          <div className='w-4 h-4 text-white/70'>♪</div>
                          <span className='text-sm text-white/80'>
                            {formatCount(post.likes_count)}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <HeroIcon iconName='ChatBubbleLeftIcon' className='h-4 w-4 text-white/70' />
                          <span className='text-sm text-white/80'>
                            {formatCount(post.comments_count)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : selectedCategory === 'Creators' ? (
              /* Grid layout for Creators */
              <div className='grid grid-cols-2 gap-2'>
                {results.map((post) => (
                  <Link key={post.id} href={`/user/${post.user?.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className='relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer'
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
                          <div className='w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' />
                        )}
                      </div>

                      {/* Gradient Overlay */}
                      <div className='absolute inset-0 bg-gradient-to-b from-transparent to-black/60' />

                      {/* Text */}
                      <div className='absolute inset-0 p-4 flex flex-col justify-end'>
                        <p className='text-xs font-medium text-white/90 mb-2'>Creator</p>
                        <p className='text-lg font-bold text-white'>
                          @{post.user?.username}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Grid layout for Mini's and Imprints */
              <div className='grid grid-cols-2 gap-2'>
                {results.map((post) => (
                  <Link key={post.id} href={`/tweet/${post.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className='relative aspect-square rounded-lg overflow-hidden cursor-pointer'
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
                        <div className='w-full h-full bg-gradient-to-br from-blue-400 to-cyan-400' />
                      )}

                      {/* Likes Badge */}
                      <div className='absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60'>
                        <div className='w-2.5 h-2.5 text-blue-400'>♪</div>
                        <span className='text-xs font-semibold text-white'>
                          {formatCount(post.likes_count)}
                        </span>
                      </div>

                      {/* Content Overlay */}
                      {post.content && (
                        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2'>
                          <p className='text-xs font-medium text-white line-clamp-2'>
                            {post.content}
                          </p>
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
