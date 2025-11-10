/**
 * useCollection Hook
 * Fetches a collection of documents from Supabase with realtime updates
 * Based on Vite version pattern
 */

import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase/client';

export interface QueryOptions {
  filter?: {
    column: string;
    value: any;
    operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';
  };
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  includeUser?: boolean;
  allowNull?: boolean;
  disabled?: boolean;
}

export function useCollection<T>(
  table: string,
  options?: QueryOptions
): {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.disabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build select query - match Vite pattern
        const selectQuery = options?.includeUser
          ? '*, user:author_id(*)'
          : '*';
        
        let query = supabase.from(table).select(selectQuery);

        // Apply filter
        if (options?.filter) {
          const { column, value, operator = 'eq' } = options.filter;
          
          if (operator === 'in') {
            query = query.in(column, value);
          } else if (operator === 'is') {
            query = query.is(column, value);
          } else {
            query = query[operator](column, value);
          }
        }

        // Apply ordering
        if (options?.orderBy) {
          query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? false
          });
        }

        // Apply limit
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) {
          if (options?.allowNull) {
            setData([]);
            setError(null);
          } else {
            throw fetchError;
          }
        } else {
          setData(result as T[]);
          setError(null);
        }
      } catch (err) {
        console.error(`Error fetching collection from ${table}:`, err);
        setError(err as Error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`${table}:collection`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        () => {
          // Refetch on any change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(options)]);

  return { data, loading, error };
}
