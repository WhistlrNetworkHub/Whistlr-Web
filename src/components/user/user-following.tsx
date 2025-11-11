import { useAuth } from '@lib/context/auth-context';

type UserFollowingProps = {
  userTargetId: string;
};

export function UserFollowing({
  userTargetId
}: UserFollowingProps): React.ReactElement | null {
  const { user } = useAuth();

  // TODO: Need to check if userTarget follows current user
  // This requires querying the follows table
  // For now, we'll hide this indicator until we implement the proper query
  const isFollowing = false;

  if (!isFollowing) return null;

  return (
    <p className='rounded bg-main-search-background px-1 text-xs'>
      Follows you
    </p>
  );
}
