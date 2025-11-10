# Authentication Implementation

## Overview
The Next.js web app uses the same Supabase authentication system as the iOS app, with some platform-specific adaptations.

## Core Features (Matching iOS)

### ✅ Implemented

1. **Session Management**
   - Auto-login with persisted sessions (localStorage via Supabase client)
   - Token refresh handled automatically by Supabase
   - Auth state changes listened via `onAuthStateChange`

2. **Sign Up Flow**
   - Email/password registration
   - Automatic profile creation in `profiles` table
   - User metadata support (full_name, username, etc.)
   - Email verification via Supabase

3. **Sign In Flow**
   - Email/password login
   - Session restoration on page reload
   - OAuth support (Google, Apple, GitHub, Figma)

4. **Profile Management**
   - Auto-create profile on first login
   - Realtime profile updates via Supabase subscriptions
   - Bookmarks loading and realtime sync

5. **Sign Out**
   - Clean session termination
   - Clear local state
   - Handled by Supabase client

### 🔄 iOS-Specific Features (Not Required for Web)

These features exist in iOS but aren't necessary for the web version:

1. **OTP Verification**
   - iOS: Custom OTP system with 6-digit codes
   - Web: Uses Supabase's built-in email confirmation

2. **Secret Questions**
   - iOS: Additional account recovery method
   - Web: Standard email-based password reset

3. **Keychain Storage**
   - iOS: Secure token storage in iOS Keychain
   - Web: localStorage (managed by Supabase client, secure for web)

4. **Multi-Account Switching**
   - iOS: Switch between multiple logged-in accounts
   - Web: Not needed (users can use multiple browser profiles)

## Implementation Details

### Auth Context (`src/lib/context/auth-context.tsx`)

```typescript
- Manages Supabase auth state
- Loads user profile from `profiles` table
- Subscribes to realtime updates
- Provides sign in/up/out methods
- Auto-creates profiles for new users
```

### Supabase Client (`src/lib/supabase/client.ts`)

```typescript
- Configured with same Supabase project as iOS
- Auto token refresh enabled
- Session persistence enabled
- Matches Vite version configuration
```

### Auth Helpers

```typescript
- signUp(email, password, metadata)
- signIn(email, password)
- signInWithOAuth(provider)
- signOut()
- getCurrentUser()
- getCurrentSession()
- onAuthStateChange(callback)
```

## Database Schema Alignment

The web app uses the exact same database schema as iOS:

- `auth.users` - Supabase authentication users
- `public.profiles` - User profiles with extended data
- `public.posts` - User posts/tweets
- `public.comments` - Post comments/replies
- `public.likes` - Post likes
- `public.post_saves` - Bookmarks
- `public.follows` - Follow relationships
- `public.reposts` - Repost/boost functionality
- `public.hashtags` - Trending hashtags

## Session Flow

### Sign Up
1. User submits email/password + metadata
2. Supabase creates auth user
3. Sends confirmation email (if required)
4. `onAuthStateChange` fires with `SIGNED_IN` event
5. Profile auto-created in `profiles` table
6. Session persisted in localStorage
7. Realtime subscriptions established

### Sign In
1. User submits email/password
2. Supabase verifies credentials
3. Returns session tokens
4. `onAuthStateChange` fires
5. Profile loaded from database
6. Bookmarks and preferences loaded
7. Realtime subscriptions established

### Session Restoration (Page Reload)
1. App checks for stored session in localStorage
2. Supabase validates tokens with server
3. If valid: auto-login, load profile
4. If expired: refresh tokens automatically
5. If invalid: show login screen

## Security

- ✅ Secure token storage (browser localStorage)
- ✅ Automatic token refresh
- ✅ HTTPS only in production
- ✅ Row Level Security (RLS) policies in Supabase
- ✅ Email verification (configurable)
- ✅ OAuth with trusted providers

## Comparison with iOS

| Feature | iOS | Next.js Web | Notes |
|---------|-----|-------------|-------|
| Email/Password Auth | ✅ | ✅ | Same implementation |
| OAuth (Google, etc.) | ✅ | ✅ | Same providers |
| Session Persistence | ✅ Keychain | ✅ localStorage | Platform-specific storage |
| Auto-login | ✅ | ✅ | Same behavior |
| Token Refresh | ✅ | ✅ | Handled by Supabase |
| Profile Auto-creation | ✅ | ✅ | Same logic |
| Realtime Updates | ✅ | ✅ | Same subscriptions |
| OTP Verification | ✅ | ⚠️ | Web uses email links |
| Secret Questions | ✅ | ❌ | Not needed for web |
| Multi-Account Switching | ✅ | ❌ | Not needed for web |

## Conclusion

The Next.js web app authentication system is **fully compatible** with the iOS app, using the same:
- Supabase project
- Database schema
- Auth flows
- Session management
- Profile structure

Platform-specific differences (OTP, secret questions, Keychain) are appropriate adaptations that don't affect cross-platform compatibility.

