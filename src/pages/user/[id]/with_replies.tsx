import { AnimatePresence } from 'framer-motion';
import { useCollection } from '@lib/hooks/useCollection';
import { useDocument } from '@lib/hooks/useDocument';
import { whistlesCollection, commentsCollection } from '@lib/supabase/collections';
import { useUser } from '@lib/context/user-context';
import { UserLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { UserDataLayout } from '@components/layout/user-data-layout';
import { UserHomeLayout } from '@components/layout/user-home-layout';
import { Whistle } from '@components/whistle/whistle';
import { Loading } from '@components/ui/loading';
import { StatsEmpty } from '@components/whistle/stats-empty';
import type { ReactElement, ReactNode } from 'react';

export default function UserWithReplies(): JSX.Element {
  const { user } = useUser();

  const { id, full_name, username, pinned_post_id } = user ?? {};

  const { data: pinnedData } = useDocument(
    whistlesCollection,
    pinned_post_id ?? 'null',
    {
      disabled: !pinned_post_id,
      allowNull: true,
      includeUser: true
    }
  );

  // Fetch all posts by user
  const { data: posts, loading: postsLoading } = useCollection(
    whistlesCollection,
    {
      filter: { column: 'author_id', value: id },
      orderBy: { column: 'created_at', ascending: false }
    },
    { includeUser: true, allowNull: true }
  );

  // Fetch all comments by user
  const { data: comments, loading: commentsLoading } = useCollection(
    commentsCollection,
    {
      filter: { column: 'author_id', value: id },
      orderBy: { column: 'created_at', ascending: false }
    },
    { includeUser: true, allowNull: true }
  );

  const loading = postsLoading || commentsLoading;

  return (
    <section>
      <SEO
        title={`Posts with replies by ${full_name as string} (@${
          username as string
        }) / Whistlr`}
      />
      {loading ? (
        <Loading className='mt-5' />
      ) : (!posts || posts.length === 0) && (!comments || comments.length === 0) ? (
        <StatsEmpty
          title={`@${username as string} hasn't whistled yet`}
          description='When they do, their whistles will show up here.'
        />
      ) : (
        <AnimatePresence mode='popLayout'>
          {pinnedData && (
            <Whistle pinned {...pinnedData} key={`pinned-${pinnedData.id}`} />
          )}
          {posts?.map((whistle) => (
            <Whistle {...whistle} key={whistle.id} />
          ))}
        </AnimatePresence>
      )}
    </section>
  );
}

UserWithReplies.getLayout = (page: ReactElement): ReactNode => (
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
