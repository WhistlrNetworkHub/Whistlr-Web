import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Redirect to the simpler profile page
export default function UserProfileRedirect(): null {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      // Redirect to parent route which uses [id].tsx
      router.replace(`/user/${id}`);
    }
  }, [id, router]);

  return null;
}
