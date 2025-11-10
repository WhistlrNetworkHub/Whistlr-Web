# Twitter Clone - Firebase to Supabase Migration

## Overview
Successfully migrated the Twitter Clone from Firebase to Supabase, updated all dependencies to latest versions, and launched on port 4422.

## Changes Made

### 1. Dependencies Updated
- **Next.js**: 12.3.0 → 15.1.3
- **React**: 18.2.0 → 19.0.0
- **TypeScript**: 4.7.4 → 5.7.2
- **Tailwind CSS**: 3.2.4 → 3.4.17
- **Removed**: Firebase (9.9.4)
- **Added**: @supabase/supabase-js (2.47.10)

### 2. Supabase Integration

#### Created Files:
- `src/lib/supabase/client.ts` - Supabase client initialization
- `src/lib/supabase/types.ts` - Database type definitions
- `src/lib/supabase/utils.ts` - Database utility functions

#### Replaced Files:
- `src/lib/context/auth-context.tsx` - Supabase Auth with Google OAuth
- `src/lib/hooks/useDocument.ts` - Real-time document subscription
- `src/lib/hooks/useCollection.ts` - Real-time collection queries
- `src/lib/hooks/useArrayDocument.ts` - Batch document fetching

#### Removed:
- `src/lib/firebase/` - Entire Firebase directory

### 3. Type System Updates
- Changed `Timestamp` to `string` (ISO 8601 format)
- Removed Firebase-specific converters
- Added `email` field to User type
- Updated Bookmark type with userId and tweetId

### 4. Database Schema (Supabase)

Required tables:
```sql
-- users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  photoURL TEXT NOT NULL,
  coverPhotoURL TEXT,
  verified BOOLEAN DEFAULT false,
  following TEXT[] DEFAULT '{}',
  followers TEXT[] DEFAULT '{}',
  theme TEXT,
  accent TEXT,
  totalTweets INTEGER DEFAULT 0,
  totalPhotos INTEGER DEFAULT 0,
  pinnedTweet TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- tweets table
CREATE TABLE tweets (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  images JSONB,
  parent JSONB,
  userLikes TEXT[] DEFAULT '{}',
  userReplies INTEGER DEFAULT 0,
  userRetweets TEXT[] DEFAULT '{}',
  createdBy TEXT NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- user_stats table
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL REFERENCES users(id),
  likes TEXT[] DEFAULT '{}',
  tweets TEXT[] DEFAULT '{}',
  updatedAt TIMESTAMP
);

-- bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL REFERENCES users(id),
  tweetId TEXT NOT NULL REFERENCES tweets(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(userId, tweetId)
);
```

### 5. Storage Configuration
- Storage bucket: `tweets`
- Path structure: `images/{userId}/{imageId}`
- Public access enabled for uploaded images

### 6. Authentication
- Provider: Google OAuth
- Redirect URL: `{origin}/home`
- Session persistence: localStorage
- Auto-refresh tokens: enabled

## Environment Variables

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://phdgiqhcidqnfuwxszco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Running the App

```bash
cd twitter-clone-supabase
npm install --legacy-peer-deps
npm run dev
```

Server runs on: **http://localhost:4422**

## Features Migrated

✅ Google OAuth Authentication  
✅ User Profile Management  
✅ Tweet Creation & Display  
✅ Real-time Updates  
✅ Like/Retweet/Reply  
✅ Bookmarks  
✅ Image Upload  
✅ User Follow/Unfollow  
✅ Trending & Suggestions  

## Next Steps

1. **Database Setup**: Run the SQL schema in Supabase dashboard
2. **Storage Setup**: Create `tweets` bucket with public access
3. **Auth Setup**: Enable Google OAuth provider in Supabase
4. **RLS Policies**: Add Row Level Security policies for data protection
5. **Testing**: Test all features with real data

## Notes

- All Firebase imports replaced with Supabase equivalents
- Real-time subscriptions use Supabase Realtime
- Image uploads use Supabase Storage
- Date handling changed from Firestore Timestamp to ISO strings
- Legacy peer deps flag needed due to ESLint version conflicts

