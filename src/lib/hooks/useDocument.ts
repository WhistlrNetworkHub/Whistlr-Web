/**
 * useDocument Hook
 * Fetches a single document from Supabase with realtime updates
 * Based on Vite version pattern
 */

import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase/client';

export interface UseDocumentOptions {
  disabled?: boolean;
  includeUser?: boolean;
  allowNull?: boolean;
}

export function useDocument<T>(
  table: string,
  id: string | null,
  options?: UseDocumentOptions
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id || options?.disabled) {
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

        const { data: result, error: fetchError } = await supabase
          .from(table)
          .select(selectQuery)
          .eq('id', id)
          .single();

        if (fetchError) {
          if (options?.allowNull && fetchError.code === 'PGRST116') {
            setData(null);
            setError(null);
          } else {
            throw fetchError;
          }
        } else {
          setData(result as T);
          setError(null);
        }
      } catch (err) {
        console.error(`Error fetching document from ${table}:`, err);
        setError(err as Error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`${table}:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `id=eq.${id}`
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
  }, [table, id, options?.disabled, options?.includeUser, options?.allowNull]);

  return { data, loading, error };
}
