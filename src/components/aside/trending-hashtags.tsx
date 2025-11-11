/**
 * TrendingHashtags Component
 * Displays trending hashtags with post counts
 * Matches Vite version exactly
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@lib/supabase/client';

interface Hashtag {
  id: string;
  tag: string;
  usage_count: number;
}

interface TrendingHashtagsProps {
  limit?: number;
}

export function TrendingHashtags({ limit = 10 }: TrendingHashtagsProps): React.ReactElement {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrendingHashtags();
  }, [limit]);

  const loadTrendingHashtags = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading hashtags from Supabase...');

      const { data, error } = await supabase
        .from('hashtags')
        .select('id, tag, usage_count')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error loading hashtags:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} hashtags`);

      if (data && data.length > 0) {
        setHashtags(data);
        console.log('✨ Displaying hashtags:', data.slice(0, 5).map(h => `#${h.tag}`));
      } else {
        console.log('📭 No hashtags in database');
        setHashtags([]);
      }
    } catch (error) {
      console.error('❌ Error loading trending hashtags:', error);
      setHashtags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <section className='hover-animation rounded-2xl bg-main-sidebar-background'>
        <div className='flex items-center justify-between border-b border-light-border p-4 dark:border-dark-border'>
          <h2 className='text-xl font-extrabold'>Trends for you</h2>
        </div>
        <div className='flex items-center justify-center p-8'>
          <p className='text-light-secondary dark:text-dark-secondary'>
            Loading trending hashtags...
          </p>
        </div>
      </section>
    );
  }

  if (hashtags.length === 0) {
    return (
      <section className='hover-animation rounded-2xl bg-main-sidebar-background'>
        <div className='flex items-center justify-between border-b border-light-border p-4 dark:border-dark-border'>
          <h2 className='text-xl font-extrabold'>Trends for you</h2>
        </div>
        <div className='flex items-center justify-center p-8'>
          <p className='text-light-secondary dark:text-dark-secondary'>
            No trending hashtags yet
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className='hover-animation rounded-2xl bg-main-sidebar-background'>
      <div className='flex items-center justify-between border-b border-light-border p-4 dark:border-dark-border'>
        <h2 className='text-xl font-extrabold'>Trends for you</h2>
      </div>
      <div className='flex flex-col'>
        {hashtags.map((hashtag, index) => (
          <motion.div
            key={hashtag.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={`/search?q=${encodeURIComponent('#' + hashtag.tag)}`}
              className='hover-animation flex flex-col gap-0.5 border-b border-light-border
                       px-4 py-3 hover:bg-main-sidebar-background dark:border-dark-border'
            >
              <div className='flex items-start justify-between'>
                <div className='flex flex-col'>
                  <p className='text-sm text-light-secondary dark:text-dark-secondary'>
                    {index + 1} · Trending
                  </p>
                  <p className='font-bold'>#{hashtag.tag}</p>
                  <p className='text-sm text-light-secondary dark:text-dark-secondary'>
                    {formatCount(hashtag.usage_count)} posts
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <Link
        href='/explore/trending'
        className='hover-animation block border-t border-light-border p-4 
                 text-center text-main-accent hover:bg-main-sidebar-background 
                 dark:border-dark-border'
      >
        Show more
      </Link>
    </section>
  );
}
