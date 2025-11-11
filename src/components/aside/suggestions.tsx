import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useAuth } from '@lib/context/auth-context';
import { useCollection } from '@lib/hooks/useCollection';
import { useDocument } from '@lib/hooks/useDocument';
import { usersCollection } from '@lib/supabase/collections';
import { UserCard } from '@components/user/user-card';
import { Loading } from '@components/ui/loading';
import { Error } from '@components/ui/error';

const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } }
};

export function Suggestions(): React.ReactElement {
  const { user } = useAuth();

  // Fetch admin/featured user (you can replace this ID with your actual admin user ID)
  const { data: adminData, loading: adminLoading } = useDocument(
    usersCollection,
    null, // Disable for now until we have a proper admin ID
    { allowNull: true, disabled: true }
  );

  // Fetch random suggestions - simplified for Supabase
  const { data: suggestionsData, loading: suggestionsLoading } = useCollection(
    usersCollection,
    {
      orderBy: { column: 'created_at', ascending: false },
      limit: 3
    }
  );

  return (
    <section className='hover-animation rounded-2xl glass-morphism'>
      {adminLoading || suggestionsLoading ? (
        <Loading className='flex h-52 items-center justify-center p-4' />
      ) : suggestionsData ? (
        <motion.div className='inner:px-4 inner:py-3' {...variants}>
          <h2 className='text-xl font-bold'>Who to follow</h2>
          {adminData ? <UserCard {...(adminData as any)} /> : null}
          {suggestionsData?.map((userData) => (
            <UserCard {...userData} key={userData.id} />
          ))}
          <Link 
            href='/people'
            className='custom-button accent-tab hover-card block w-full rounded-2xl
                       rounded-t-none text-center text-main-accent'
          >
            Show more
          </Link>
        </motion.div>
      ) : (
        <Error />
      )}
    </section>
  );
}
