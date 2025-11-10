import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase/client';

type QueryOptions = {
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  filter?: { column: string; value: any };
};

export function useCollection<T>(
  table: string,
  options?: QueryOptions & { disabled?: boolean }
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
        let query = supabase.from(table).select('*');

        if (options?.filter) {
          query = query.eq(options.filter.column, options.filter.value);
        }

        if (options?.orderBy) {
          query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? false
          });
        }

        if (options?.limit) {
          query = query.limit(options?.limit);
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setData(result as T[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to changes
    const channel = supabase
      .channel(`${table}:collection`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, JSON.stringify(options)]);

  return { data, loading, error };
}
