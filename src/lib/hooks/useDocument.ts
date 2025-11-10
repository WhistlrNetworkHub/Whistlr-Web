import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase/client';

export function useDocument<T>(
  table: string,
  id: string | null,
  options?: { disabled?: boolean; includeUser?: boolean }
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
        const { data: result, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setData(result as T);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to changes
    const channel = supabase
      .channel(`${table}:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `id=eq.${id}`
        },
        (payload) => {
          setData(payload.new as T);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, id, options?.disabled]);

  return { data, loading, error };
}
