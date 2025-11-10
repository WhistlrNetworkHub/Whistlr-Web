/**
 * AsideTrends Component
 * Displays trending topics
 * Uses TrendingHashtags component for real data from Supabase
 */

import { TrendingHashtags } from './trending-hashtags';

export function AsideTrends(): JSX.Element {
  return (
    <section className='hover-animation rounded-2xl bg-main-sidebar-background'>
      <TrendingHashtags limit={10} />
    </section>
  );
}
