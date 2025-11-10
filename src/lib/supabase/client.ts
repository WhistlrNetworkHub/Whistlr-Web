import { createClient } from '@supabase/supabase-js';

// Supabase configuration - matches Vite version exactly
// Supports both Next.js and Vite environment variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://phdgiqhcidqnfuwxszco.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGdpcWhjaWRxbmZ1d3hzemNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDM1MTUsImV4cCI6MjA3MTExOTUxNX0.Dy8V4OrVutRN56yovTAOINKk3KtuajvWOr3X46USnzs';

if (typeof window !== 'undefined') {
  console.log('🔧 Supabase config:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    source: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC' : 'fallback'
  });
}

// Create Supabase client with proper configuration matching Vite version
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-phdgiqhcidqnfuwxszco-auth-token',
  },
  global: {
    headers: {
      'x-client-info': 'whistlr-web@1.0.0'
    }
  }
});

if (typeof window !== 'undefined') {
  console.log('✅ Supabase client initialized:', supabaseUrl);
  
  // Debug: Check if session exists in storage on init
  const storedSession = localStorage.getItem('sb-phdgiqhcidqnfuwxszco-auth-token');
  console.log('🔍 Stored session exists:', !!storedSession);
}

// Auth helper functions matching Vite/iOS implementation
export const supabaseAuth = {
  // Sign up with email/password
  signUp: async (email: string, password: string, metadata?: { full_name?: string; username?: string }) => {
    console.log('🚀 Starting sign up for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    });

    if (error) {
      console.error('❌ Sign up failed:', error.message);
      throw error;
    }

    console.log('📧 Sign up response received. Email confirmed:', data.user?.email_confirmed_at !== null);
    return data;
  },

  // Sign in with email/password
  signIn: async (email: string, password: string) => {
    console.log('🔑 Attempting signin with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Signin failed:', error.message);
      throw error;
    }

    console.log('✅ Signin successful for:', email);
    return data;
  },

  // Sign in with OAuth (Google, Apple, GitHub, Figma)
  signInWithOAuth: async (provider: 'google' | 'apple' | 'github' | 'figma') => {
    console.log(`🟡 Starting ${provider} OAuth sign-in`);
    
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      console.error(`❌ ${provider} OAuth failed:`, error.message);
      throw error;
    }

    console.log(`✅ ${provider} OAuth initiated successfully`);
    return data;
  },

  // Sign out
  signOut: async () => {
    console.log('👋 Signing out');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out failed:', error.message);
      throw error;
    }
    
    console.log('✅ Sign out successful');
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  // Get current session
  getCurrentSession: () => {
    return supabase.auth.getSession();
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth State Change:', event);
      callback(event, session);
    });
  }
};

// Environment info for debugging
export const config = {
  supabaseUrl,
  isDevelopment: process.env.NODE_ENV === 'development',
  appName: 'Whistlr Web',
  version: '2.0.0'
};

// Print configuration in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('=== Whistlr Web Configuration ===');
  console.log('Environment: development');
  console.log('Supabase URL:', supabaseUrl);
  console.log('App Name:', config.appName);
  console.log('Version:', config.version);
  console.log('=====================================');
}
