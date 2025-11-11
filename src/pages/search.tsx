import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@lib/supabase/client';
import { AnimatePresence } from 'framer-motion';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Tweet } from '@components/tweet/tweet';
import { UserCard } from '@components/user/user-card';
import { Loading } from '@components/ui/loading';
import type { ReactElement, ReactNode } from 'react';

export default function Search(): JSX.Element {
  const router = useRouter();
  const { q } = router.query;

  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'hashtags'>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || typeof q !== 'string') return;

    const searchAll = async () => {
      setLoading(true);

      // Search posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, user:author_id(*)')
        .or(`content.ilike.%${q}%,hashtags.cs.{${q}}`)
        .order('created_at', { ascending: false })
        .limit(20);

      setPosts(postsData || []);

      // Search users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, is_verified, followers_count, following_count')
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(20);

      setUsers(usersData || []);

      // Search hashtags
      const { data: hashtagsData } = await supabase
        .from('hashtags')
        .select('*')
        .ilike('tag', `%${q}%`)
        .order('usage_count', { ascending: false })
        .limit(20);

      setHashtags(hashtagsData || []);

      setLoading(false);
    };

    searchAll();
  }, [q]);

  return (
    <MainContainer>
      <SEO title={`Search: ${q} / Whistlr`} />
      <MainHeader title='Search' className='flex items-center justify-between' />

      {/* Tabs */}
      <div className='border-b border-light-border dark:border-dark-border'>
        <div className='flex'>
          {[
            { key: 'posts', label: 'Posts' },
            { key: 'users', label: 'Users' },
            { key: 'hashtags', label: 'Hashtags' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                activeTab === key
                  ? 'border-b-4 border-accent-blue text-light-primary dark:text-dark-primary'
                  : 'text-light-secondary hover:bg-light-primary/5 dark:text-dark-secondary dark:hover:bg-dark-primary/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className='mt-0.5'>
        {loading ? (
          <Loading className='mt-5' />
        ) : (
          <>
            {activeTab === 'posts' && (
              <>
                {posts.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-20'>
                    <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No posts found</p>
                  </div>
                ) : (
                  <AnimatePresence mode='popLayout'>
                    {posts.map((tweet) => (
                      <Tweet {...tweet} key={tweet.id} />
                    ))}
                  </AnimatePresence>
                )}
              </>
            )}

            {activeTab === 'users' && (
              <>
                {users.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-20'>
                    <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No users found</p>
                  </div>
                ) : (
                  <div>
                    {users.map((user) => (
                      <UserCard key={user.id} {...user} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'hashtags' && (
              <>
                {hashtags.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-20'>
                    <p className='text-xl font-semibold text-light-primary dark:text-dark-primary'>No hashtags found</p>
                  </div>
                ) : (
                  <div className='divide-y divide-light-border dark:divide-dark-border'>
                    {hashtags.map((hashtag: any) => (
                      <a
                        key={hashtag.id}
                        href={`/hashtag/${hashtag.tag.replace('#', '')}`}
                        className='block p-4 transition hover:bg-light-primary/5 dark:hover:bg-dark-primary/5'
                      >
                        <p className='text-lg font-bold text-accent-blue'>#{hashtag.tag}</p>
                        <p className='text-sm text-light-secondary dark:text-dark-secondary'>
                          {hashtag.usage_count} posts
                        </p>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
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


