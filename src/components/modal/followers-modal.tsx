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
      console.log(`🔍 Loading ${type} for profile:`, profileId);
      
      try {
        if (type === 'followers') {
          // Get users who follow this profile
          console.log('📥 Fetching followers (people who follow this profile)');
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', profileId);

          console.log('Followers data:', followData, 'Error:', followError);

          if (followData && followData.length > 0) {
            const followerIds = followData.map((f) => f.follower_id);
            console.log('Follower IDs:', followerIds);
            
            const { data: usersData, error: usersError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', followerIds);

            console.log('Follower profiles:', usersData, 'Error:', usersError);

            if (usersData) {
              setUsers(usersData as User[]);
            }
          } else {
            console.log('No followers found');
            setUsers([]);
          }
        } else {
          // Get users this profile follows
          console.log('📤 Fetching following (people this profile follows)');
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', profileId);

          console.log('Following data:', followData, 'Error:', followError);

          if (followData && followData.length > 0) {
            const followingIds = followData.map((f) => f.following_id);
            console.log('Following IDs:', followingIds);
            
            const { data: usersData, error: usersError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', followingIds);

            console.log('Following profiles:', usersData, 'Error:', usersError);

            if (usersData) {
              setUsers(usersData as User[]);
            }
          } else {
            console.log('No following found');
            setUsers([]);
          }
        }
      } catch (error) {
        console.error('❌ Error loading users:', error);
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
      modalClassName='relative rounded-2xl max-w-xl w-full h-[672px] overflow-hidden border border-white/10 shadow-2xl'
      open={open}
      closeModal={closeModal}
    >
      <div 
        className='absolute inset-0 rounded-2xl'
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
      />
      <div className='relative z-10 h-full flex flex-col'>
        <MainHeader
          useActionButton
          className='border-b border-white/5'
          style={{
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          iconName='XMarkIcon'
          title={type === 'followers' ? `Followers` : `Following`}
          tip='Close'
          action={closeModal}
        />
        <section className='flex-1 overflow-y-auto'>
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
      </div>
    </Modal>
  );
}

