/**
 * Auth Context
 * Manages authentication state and user profile
 * Based on Vite and iOS patterns
 */

import { useState, useEffect, createContext, useContext, useMemo, ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@lib/supabase/client';
import type { User } from '@lib/types/user';
import type { Bookmark } from '@lib/types/bookmark';

interface AuthContextValue {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  userBookmarks: Bookmark[];
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, metadata?: { full_name?: string; username?: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }

  return context;
}

interface AuthContextProviderProps {
  children: ReactNode;
}

export function AuthContextProvider({ children }: AuthContextProviderProps): React.ReactElement {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userBookmarks, setUserBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => user?.id === 'admin-user-id', [user]);

  useEffect(() => {
    console.log('🔐 Initializing auth context...');

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Session restored:', session.user.email);
          setSupabaseUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          console.log('📭 No session found');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Auth initialization failed:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);

        if (session?.user) {
          setSupabaseUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setSupabaseUser(null);
          setUser(null);
          setUserBookmarks([]);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('👤 Loading user profile for:', userId);

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('👤 Profile not found, creating one...');
          await createUserProfile(userId);
          return;
        }
        throw profileError;
      }

      if (profile) {
        console.log('✅ Profile loaded:', profile.username);
        setUser(profile as User);
        
        // Load bookmarks
        await loadUserBookmarks(userId);
        
        // Subscribe to realtime updates
        subscribeToProfile(userId);
        subscribeToBookmarks(userId);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const newProfile = {
        id: userId,
        username: authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || 'user',
        full_name: authUser?.user_metadata?.full_name || null,
        email: authUser?.email || null,
        avatar_url: authUser?.user_metadata?.avatar_url || null
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Profile created:', data.username);
      setUser(data as User);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      setLoading(false);
    }
  };

  const loadUserBookmarks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_saves')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setUserBookmarks(data as Bookmark[]);
      console.log('📑 Loaded', data.length, 'bookmarks');
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error);
    }
  };

  const subscribeToProfile = (userId: string) => {
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        async (payload) => {
          console.log('🔄 Profile updated:', payload);
          setUser(payload.new as User);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToBookmarks = (userId: string) => {
    const channel = supabase
      .channel(`bookmarks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_saves',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          console.log('🔄 Bookmarks updated');
          await loadUserBookmarks(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const signOut = async () => {
    try {
      console.log('👋 Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setUserBookmarks([]);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('🔑 Signing in with email:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      console.log('✅ Signed in successfully');
    } catch (error) {
      console.error('❌ Error signing in:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; username?: string }
  ) => {
    try {
      console.log('📝 Signing up with email:', email);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) throw error;
      console.log('✅ Signed up successfully');
    } catch (error) {
      console.error('❌ Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔵 Signing in with Google...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      user,
      supabaseUser,
      loading,
      isAdmin,
      userBookmarks,
      signOut,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle
    }),
    [user, supabaseUser, loading, isAdmin, userBookmarks]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
