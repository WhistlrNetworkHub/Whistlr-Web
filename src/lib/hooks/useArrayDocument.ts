import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase/client';

export function useArrayDocument<T>(
  table: string,
  ids: string[],
  options?: { disabled?: boolean }
): {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ids.length || options?.disabled) {
      setLoading(false);
      setData([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: result, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .in('id', ids);

        if (fetchError) throw fetchError;
        setData(result as T[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, JSON.stringify(ids), options?.disabled]);

  return { data, loading, error };
}
