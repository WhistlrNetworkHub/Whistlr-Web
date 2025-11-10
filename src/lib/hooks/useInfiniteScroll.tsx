/**
 * useInfiniteScroll Hook
 * Implements cursor-based infinite scrolling for posts
 * Based on Vite version pattern
 */

import { useState, useEffect, useCallback, JSX } from 'react';
import { supabase } from '@lib/supabase/client';
import { Loading } from '@components/ui/loading';
import { motion } from 'framer-motion';

interface QueryOptions {
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  filters?: Array<{
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'is' | 'in';
    value: any;
  }>;
}

interface UseCollectionOptions {
  includeUser?: boolean;
  allowNull?: boolean;
  preserve?: boolean;
  disabled?: boolean;
}

interface InfiniteScrollOptions {
  initialSize?: number;
  stepSize?: number;
  marginBottom?: number;
}

interface InfiniteScroll<T> {
  data: T[] | null;
  loading: boolean;
  LoadMore: () => JSX.Element;
}

interface InfiniteScrollWithUser<T> extends InfiniteScroll<T> {}

/**
 * Fetch posts with pagination matching Vite/iOS pattern
 */
export function useInfiniteScroll<T>(
  tableName: string,
  queryOptions: QueryOptions = {},
  fetchOptions?: UseCollectionOptions,
  options?: InfiniteScrollOptions
): InfiniteScroll<T> | InfiniteScrollWithUser<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const initialSize = options?.initialSize ?? 20;
  const stepSize = options?.stepSize ?? 20;

  const fetchData = useCallback(
    async (append = false) => {
      if (fetchOptions?.disabled) {
        setLoading(false);
        return;
      }

      try {
        if (!append) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        // Build query matching Vite pattern
        const selectQuery = fetchOptions?.includeUser
          ? '*, user:author_id(*)'
          : '*';

        let query = supabase.from(tableName).select(selectQuery);

        // Apply filters
        if (queryOptions.filters) {
          for (const filter of queryOptions.filters) {
            if (filter.operator === 'is') {
              query = query.is(filter.column, filter.value);
            } else if (filter.operator === 'in') {
              query = query.in(filter.column, filter.value);
            } else {
              query = query[filter.operator](filter.column, filter.value);
            }
          }
        }

        // Apply ordering
        if (queryOptions.orderBy) {
          query = query.order(queryOptions.orderBy.column, {
            ascending: queryOptions.orderBy.ascending ?? false
          });
        }

        // Apply cursor for pagination
        if (append && cursor) {
          query = query.lt('created_at', cursor);
        }

        // Apply limit
        const limit = append ? stepSize : initialSize;
        query = query.limit(limit);

        const { data: result, error } = await query;

        if (error) {
          console.error('Error fetching data:', error);
          if (fetchOptions?.allowNull) {
            setData(append ? data : []);
          }
        } else if (result) {
          const newData = result as T[];
          
          if (append && data) {
            setData([...data, ...newData]);
          } else {
            setData(newData);
          }

          // Update cursor and hasMore
          if (newData.length < limit) {
            setHasMore(false);
          } else if (newData.length > 0) {
            const lastItem = newData[newData.length - 1] as any;
            setCursor(lastItem.created_at);
            setHasMore(true);
          }
        }
      } catch (err) {
        console.error('Error in useInfiniteScroll:', err);
        setData(null);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [tableName, JSON.stringify(queryOptions), cursor, data, fetchOptions, initialSize, stepSize]
  );

  // Initial fetch
  useEffect(() => {
    if (!fetchOptions?.preserve) {
      fetchData(false);
    }
  }, [tableName, JSON.stringify(queryOptions), fetchOptions?.disabled]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (fetchOptions?.disabled) return;

    const channel = supabase
      .channel(`${tableName}:infinite`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        () => {
          // Refetch on any change
          fetchData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, fetchData, fetchOptions?.disabled]);

  const LoadMore = (): JSX.Element => (
    <motion.button
      type='button'
      className='hover-animation mt-3 flex h-12 w-full items-center
                 justify-center rounded-md border border-light-line-reply 
                 font-bold text-main-accent hover:bg-accent-blue/10
                 dark:border-dark-line-reply'
      onClick={() => fetchData(true)}
      disabled={!hasMore || isLoadingMore || loading}
      {...(!hasMore && { style: { display: 'none' } })}
    >
      {isLoadingMore ? <Loading /> : 'Load more'}
    </motion.button>
  );

  return { data, loading, LoadMore };
}
