import { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { supabase } from '@lib/supabase/client';
import { getRandomId, getRandomInt } from '@lib/random';
import { checkUsernameAvailability } from '@lib/supabase/utils';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@lib/types/user';
import type { Bookmark } from '@lib/types/bookmark';

type AuthContext = {
  user: User | null;
  error: Error | null;
  loading: boolean;
  isAdmin: boolean;
  randomSeed: string;
  userBookmarks: Bookmark[] | null;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContext | null>(null);

type AuthContextProviderProps = {
  children: ReactNode;
};

export function AuthContextProvider({
  children
}: AuthContextProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [userBookmarks, setUserBookmarks] = useState<Bookmark[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const manageUser = async (authUser: SupabaseUser): Promise<void> => {
      const { id, user_metadata } = authUser;
      const displayName = user_metadata?.full_name || user_metadata?.name || 'User';
      const photoURL = user_metadata?.avatar_url || user_metadata?.picture;

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (!existingUser) {
        let available = false;
        let randomUsername = '';

        while (!available) {
          const normalizeName = displayName?.replace(/\s/g, '').toLowerCase();
          const randomInt = getRandomInt(1, 10_000);

          randomUsername = `${normalizeName}${randomInt}`;

          const isUsernameAvailable = await checkUsernameAvailability(
            randomUsername
          );

          if (isUsernameAvailable) available = true;
        }

        const userData: User = {
          id,
          bio: null,
          name: displayName,
          email: authUser.email || null,
          theme: null,
          accent: null,
          website: null,
          location: null,
          photoURL: photoURL ?? '/assets/whistlr-avatar.jpg',
          username: randomUsername,
          verified: false,
          following: [],
          followers: [],
          createdAt: new Date().toISOString(),
          updatedAt: null,
          totalTweets: 0,
          totalPhotos: 0,
          pinnedTweet: null,
          coverPhotoURL: null
        };

        const userStatsData = {
          userId: id,
          likes: [],
          tweets: [],
          updatedAt: null
        };

        try {
          await Promise.all([
            supabase.from('users').insert(userData),
            supabase.from('user_stats').insert(userStatsData)
          ]);

          const { data: newUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

          setUser(newUser as User);
        } catch (error) {
          setError(error as Error);
        }
      } else {
        setUser(existingUser as User);
      }

      setLoading(false);
    };

    const handleUserAuth = (authUser: SupabaseUser | null): void => {
      setLoading(true);

      if (authUser) void manageUser(authUser);
      else {
        setUser(null);
        setLoading(false);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserAuth(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleUserAuth(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const { id } = user;

    // Subscribe to user changes
    const userChannel = supabase
      .channel(`user:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setUser(payload.new as User);
        }
      )
      .subscribe();

    // Subscribe to bookmarks
    const bookmarksChannel = supabase
      .channel(`bookmarks:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `userId=eq.${id}`
        },
        async () => {
          const { data } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('userId', id);
          setUserBookmarks(data as Bookmark[]);
        }
      )
      .subscribe();

    // Load initial bookmarks
    supabase
      .from('bookmarks')
      .select('*')
      .eq('userId', id)
      .then(({ data }) => {
        setUserBookmarks(data as Bookmark[]);
      });

    return () => {
      userChannel.unsubscribe();
      bookmarksChannel.unsubscribe();
    };
  }, [user?.id]);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(error as Error);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });
      if (error) throw error;
      
      // User will be created in manageUser when auth state changes
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      setError(error as Error);
    }
  };

  const isAdmin = user ? user.username === 'ccrsxx' : false;
  const randomSeed = useMemo(getRandomId, [user?.id]);

  const value: AuthContext = {
    user,
    error,
    loading,
    isAdmin,
    randomSeed,
    userBookmarks,
    signOut,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContext {
  const context = useContext(AuthContext);

  if (!context)
    throw new Error('useAuth must be used within an AuthContextProvider');

  return context;
}
