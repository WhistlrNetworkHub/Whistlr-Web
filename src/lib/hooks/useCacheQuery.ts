import { useState, useEffect } from 'react';

// Cache hook for Supabase queries
export function useCacheQuery<T>(query: any): any {
  const [cachedQuery, setCachedQuery] = useState(query);

  useEffect(() => {
    if (!queryEqual(query, cachedQuery)) setCachedQuery(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return cachedQuery;
}
