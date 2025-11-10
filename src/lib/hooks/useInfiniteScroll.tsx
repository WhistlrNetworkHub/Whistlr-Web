/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@lib/supabase/client';
import { Loading } from '@components/ui/loading';
import type { User } from '@lib/types/user';

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

type QueryFilter = {
  column: string;
  operator: FilterOperator;
  value: any;
};

type QueryOptions = {
  filters?: QueryFilter[];
  orderBy?: { column: string; ascending?: boolean };
};

type UseCollectionOptions = {
  includeUser?: boolean;
  allowNull?: boolean;
  preserve?: boolean;
  disabled?: boolean;
};

type InfiniteScroll<T> = {
  data: T[] | null;
  loading: boolean;
  LoadMore: () => JSX.Element;
};

type InfiniteScrollWithUser<T> = {
  data: (T & { user: User })[] | null;
  loading: boolean;
  LoadMore: () => JSX.Element;
};

export function useInfiniteScroll<T>(
  tableName: string,
  queryOptions: QueryOptions,
  fetchOptions: UseCollectionOptions & { includeUser: true },
  options?: { initialSize?: number; stepSize?: number; marginBottom?: number }
): InfiniteScrollWithUser<T>;

export function useInfiniteScroll<T>(
  tableName: string,
  queryOptions: QueryOptions,
  fetchOptions?: UseCollectionOptions,
  options?: { initialSize?: number; stepSize?: number; marginBottom?: number }
): InfiniteScroll<T>;

export function useInfiniteScroll<T>(
  tableName: string,
  queryOptions: QueryOptions = {},
  fetchOptions?: UseCollectionOptions,
  options?: { initialSize?: number; stepSize?: number; marginBottom?: number }
): InfiniteScroll<T> | InfiniteScrollWithUser<T> {
  const { initialSize, stepSize, marginBottom } = options ?? {};

  const [tweetsLimit, setTweetsLimit] = useState(initialSize ?? 20);
  const [tweetsSize, setTweetsSize] = useState<number | null>(null);
  const [reachedLimit, setReachedLimit] = useState(false);
  const [loadMoreInView, setLoadMoreInView] = useState(false);
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (fetchOptions?.disabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from(tableName).select(
        fetchOptions?.includeUser
          ? '*, user:created_by(*)' 
          : '*'
      );

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

      // Apply limit
      if (!reachedLimit) {
        query = query.limit(tweetsLimit);
      }

      const { data: result, error } = await query;

      if (error) throw error;
      setData(result as T[]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tableName, JSON.stringify(queryOptions), tweetsLimit, reachedLimit, fetchOptions?.disabled, fetchOptions?.includeUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const checkLimit = tweetsSize ? tweetsLimit >= tweetsSize : false;
    setReachedLimit(checkLimit);
  }, [tweetsSize, tweetsLimit]);

  useEffect(() => {
    if (reachedLimit) return;

    const setTweetsLength = async (): Promise<void> => {
      try {
        let countQuery = supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        // Apply same filters for count
        if (queryOptions.filters) {
          for (const filter of queryOptions.filters) {
            if (filter.operator === 'is') {
              countQuery = countQuery.is(filter.column, filter.value);
            } else if (filter.operator === 'in') {
              countQuery = countQuery.in(filter.column, filter.value);
            } else {
              countQuery = countQuery[filter.operator](filter.column, filter.value);
            }
          }
        }

        const { count, error } = await countQuery;
        if (error) throw error;
        setTweetsSize(count ?? 0);
      } catch (err) {
        console.error('Error getting count:', err);
      }
    };

    void setTweetsLength();
  }, [data?.length]);

  useEffect(() => {
    if (reachedLimit) return;
    if (loadMoreInView) setTweetsLimit(tweetsLimit + (stepSize ?? 20));
  }, [loadMoreInView]);

  const makeItInView = (): void => setLoadMoreInView(true);
  const makeItNotInView = (): void => setLoadMoreInView(false);

  const isLoadMoreHidden =
    reachedLimit && (data?.length ?? 0) >= (tweetsSize ?? 0);

  const LoadMore = useCallback(
    (): JSX.Element => (
      <motion.div
        className={isLoadMoreHidden ? 'hidden' : 'block'}
        viewport={{ margin: `0px 0px ${marginBottom ?? 1000}px` }}
        onViewportEnter={makeItInView}
        onViewportLeave={makeItNotInView}
      >
        <Loading className='mt-5' />
      </motion.div>
    ),
    [isLoadMoreHidden]
  );

  return { data, loading, LoadMore };
}
