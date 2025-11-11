import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@lib/supabase/client';
import { Modal } from '@components/modal/modal';
import { MainHeader } from '@components/home/main-header';
import { UserCard } from '@components/user/user-card';
import { Loading } from '@components/ui/loading';
import type { User } from '@lib/types/user';

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

type FollowersModalProps = {
  open: boolean;
  closeModal: () => void;
  profileId: string;
  type: 'followers' | 'following';
  username: string;
};

export function FollowersModal({
  open,
  closeModal,
  profileId,
  type,
  username
}: FollowersModalProps): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !profileId) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        if (type === 'followers') {
          // Get users who follow this profile
          const { data: followData } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', profileId);

          if (followData && followData.length > 0) {
            const followerIds = followData.map((f) => f.follower_id);
            const { data: usersData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', followerIds);

            if (usersData) {
              setUsers(usersData as User[]);
            }
          } else {
            setUsers([]);
          }
        } else {
          // Get users this profile follows
          const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', profileId);

          if (followData && followData.length > 0) {
            const followingIds = followData.map((f) => f.following_id);
            const { data: usersData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', followingIds);

            if (usersData) {
              setUsers(usersData as User[]);
            }
          } else {
            setUsers([]);
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [open, profileId, type]);

  return (
    <Modal
      className='flex items-center justify-center'
      modalClassName='relative glass-morphism-strong rounded-2xl max-w-xl w-full h-[672px] overflow-hidden'
      open={open}
      closeModal={closeModal}
    >
      <MainHeader
        useActionButton
        className='absolute top-0 w-full glass-morphism-strong border-b border-white/5 z-10'
        iconName='XMarkIcon'
        title={type === 'followers' ? `Followers` : `Following`}
        tip='Close'
        action={closeModal}
      />
      <section className='h-full overflow-y-auto pt-[52px]'>
        {loading ? (
          <Loading className='mt-20' />
        ) : users.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 px-8'>
            <p className='text-xl font-semibold text-white text-center'>
              {type === 'followers'
                ? `@${username} doesn't have any followers yet`
                : `@${username} isn't following anyone yet`}
            </p>
            <p className='text-white/60 text-sm mt-2 text-center'>
              {type === 'followers'
                ? "When someone follows this account, they'll show up here."
                : "When they follow someone, they'll show up here."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {users.map((user) => (
              <motion.div layout='position' key={user.id} {...variants}>
                <UserCard {...user} follow modal />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>
    </Modal>
  );
}

