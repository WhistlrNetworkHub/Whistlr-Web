import { AnimatePresence } from 'framer-motion';
import { useCollection } from '@lib/hooks/useCollection';
import { tweetsCollection } from '@lib/supabase/collections';
import { useUser } from '@lib/context/user-context';
import { UserLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { UserDataLayout } from '@components/layout/user-data-layout';
import { UserHomeLayout } from '@components/layout/user-home-layout';
import { Tweet } from '@components/tweet/tweet';
import { Loading } from '@components/ui/loading';
import { StatsEmpty } from '@components/tweet/stats-empty';
import type { ReactElement, ReactNode } from 'react';

export default function UserMedia(): JSX.Element {
  const { user } = useUser();

  const { id, full_name, username } = user ?? {};

  const { data, loading } = useCollection(
    tweetsCollection,
    {
      filter: { column: 'author_id', value: id },
      orderBy: { column: 'created_at', ascending: false }
    },
    { includeUser: true, allowNull: true }
  );

  // Filter posts that have media_url (images/videos)
  const mediaPosts = data?.filter((post) => post.media_url && post.media_url.length > 0) ?? [];

  return (
    <section>
      <SEO
        title={`Media posts by ${full_name as string} (@${
          username as string
        }) / Whistlr`}
      />
      {loading ? (
        <Loading className='mt-5' />
      ) : mediaPosts.length === 0 ? (
        <StatsEmpty
          title={`@${username as string} hasn't posted media`}
          description='Once they do, those posts will show up here.'
          imageData={{ src: '/assets/no-media.png', alt: 'No media' }}
        />
      ) : (
        <AnimatePresence mode='popLayout'>
          {mediaPosts.map((tweet) => (
            <Tweet {...tweet} key={tweet.id} />
          ))}
        </AnimatePresence>
      )}
    </section>
  );
}

UserMedia.getLayout = (page: ReactElement): ReactNode => (
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
