import { AnimatePresence } from 'framer-motion';
import { useUser } from '@lib/context/user-context';
import { useCollection } from '@lib/hooks/useCollection';
import { useDocument } from '@lib/hooks/useDocument';
import { tweetsCollection } from '@lib/supabase/collections';
import { UserLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { UserDataLayout } from '@components/layout/user-data-layout';
import { UserHomeLayout } from '@components/layout/user-home-layout';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { Loading } from '@components/ui/loading';
import { Tweet } from '@components/tweet/tweet';
import type { ReactElement, ReactNode } from 'react';

export default function UserTweets(): JSX.Element {
  const { user } = useUser();

  const { id, username, pinned_post_id } = user ?? {};

  // Fetch pinned post if exists
  const { data: pinnedData } = useDocument(
    tweetsCollection,
    pinned_post_id ?? 'null',
    {
      disabled: !pinned_post_id,
      allowNull: true,
      includeUser: true
    }
  );

  // Fetch user's posts (no parent, no replies)
  const { data: ownerTweets, loading } = useCollection(
    tweetsCollection,
    {
      filter: { column: 'author_id', value: id },
      orderBy: { column: 'created_at', ascending: false }
    },
    { includeUser: true, allowNull: true }
  );

  // Filter out posts with parents (replies)
  const posts = ownerTweets?.filter((tweet) => !tweet.parent_id) ?? [];

  return (
    <section>
      {loading ? (
        <Loading className='mt-5' />
      ) : posts.length === 0 ? (
        <StatsEmpty
          title={`@${username as string} hasn't posted yet`}
          description='When they do, their posts will show up here.'
        />
      ) : (
        <AnimatePresence mode='popLayout'>
          {pinnedData && (
            <Tweet pinned {...pinnedData} key={`pinned-${pinnedData.id}`} />
          )}
          {posts.map((tweet) => (
            <Tweet {...tweet} profile={user} key={tweet.id} />
          ))}
        </AnimatePresence>
      )}
    </section>
  );
}

UserTweets.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <UserLayout>
        <UserDataLayout>
          <UserHomeLayout>{page}</UserHomeLayout>
        </UserDataLayout>
      </UserLayout>
    </MainLayout>
  </ProtectedLayout>
);
