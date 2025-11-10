# Whistlr Web - Deployment Guide

## ✅ Completed Tasks

### 1. GitHub Repository
- **Repository**: https://github.com/WhistlrNetworkHub/Whistlr-Web
- **Status**: Successfully pushed (not a fork)
- **Branch**: main

### 2. Rebranding Complete
- ✅ All "Twitter" references replaced with "Whistlr"
- ✅ All "twitter" (lowercase) replaced with "whistlr"
- ✅ Package name updated to `whistlr-web`
- ✅ Copyright updated to ETAProjects Inc.
- ✅ Proprietary LICENSE added
- ✅ README updated with Whistlr branding

### 3. Authentication System
- ✅ Google OAuth (existing)
- ✅ Email/Password Sign Up
- ✅ Email/Password Sign In
- ✅ Supabase Auth integration

### 4. Server Status
- **Running**: ✅ http://localhost:4422
- **Framework**: Next.js 15.1.3
- **Backend**: Supabase

## 🔧 Required Supabase Setup

Before users can log in, you need to set up your Supabase project:

### 1. Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE
);

-- Tweets table
CREATE TABLE IF NOT EXISTS tweets (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  images JSONB,
  parent JSONB,
  userLikes TEXT[] DEFAULT '{}',
  userReplies INTEGER DEFAULT 0,
  userRetweets TEXT[] DEFAULT '{}',
  createdBy TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  likes TEXT[] DEFAULT '{}',
  tweets TEXT[] DEFAULT '{}',
  updatedAt TIMESTAMP WITH TIME ZONE,
  UNIQUE(userId)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweetId TEXT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(userId, tweetId)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tweets_createdBy ON tweets(createdBy);
CREATE INDEX IF NOT EXISTS idx_tweets_createdAt ON tweets(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_userId ON user_stats(userId);
CREATE INDEX IF NOT EXISTS idx_bookmarks_userId ON bookmarks(userId);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tweetId ON bookmarks(tweetId);
```

### 2. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Tweets policies
CREATE POLICY "Tweets are viewable by everyone" ON tweets FOR SELECT USING (true);
CREATE POLICY "Users can insert own tweets" ON tweets FOR INSERT WITH CHECK (auth.uid()::text = createdBy);
CREATE POLICY "Users can update own tweets" ON tweets FOR UPDATE USING (auth.uid()::text = createdBy);
CREATE POLICY "Users can delete own tweets" ON tweets FOR DELETE USING (auth.uid()::text = createdBy);

-- User stats policies
CREATE POLICY "User stats are viewable by everyone" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Users can manage own stats" ON user_stats FOR ALL USING (auth.uid()::text = userId);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid()::text = userId);
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid()::text = userId);
```

### 3. Storage Setup

1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `tweets`
3. Make it **public**
4. Add this policy for uploads:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tweets');

-- Allow public read access
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tweets');
```

### 4. Authentication Setup

1. Go to Authentication > Providers in Supabase Dashboard
2. **Enable Email provider** (already enabled by default)
3. **Enable Google OAuth**:
   - Get credentials from Google Cloud Console
   - Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
4. **Email Templates** (optional but recommended):
   - Customize confirmation email
   - Customize password reset email

### 5. Realtime Setup

Enable Realtime for tables:

```sql
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE tweets;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. Push to GitHub (already done ✅)
2. Go to [vercel.com](https://vercel.com)
3. Import the repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Option 2: Self-Hosted

```bash
npm run build
npm start
```

## 🔐 Environment Variables

Current `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://phdgiqhcidqnfuwxszco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Testing Authentication

### Email/Password Sign Up:
1. Go to http://localhost:4422
2. Click "Sign up with email"
3. Enter name, email, password
4. Check email for verification link
5. Click link to verify
6. Sign in with credentials

### Google OAuth:
1. Go to http://localhost:4422
2. Click "Sign up with Google"
3. Authorize with Google account
4. Redirects to /home

## 🎨 Branding Changes Made

- **Name**: Twitter → Whistlr
- **Author**: Original → ETAProjects Inc.
- **License**: MIT → Proprietary (UNLICENSED)
- **URLs**: twitter.com → whistlr.com references
- **Assets**: twitter-avatar.jpg → whistlr-avatar.jpg (needs update)
- **Icons**: TwitterIcon → WhistlrIcon (needs icon file)

## ⚠️ Important Notes

1. **Database must be set up** before authentication works
2. **Email verification** is required for email/password signups
3. **Google OAuth** requires credentials from Google Cloud Console
4. **Storage bucket** must exist for image uploads
5. **RLS policies** are critical for security

## 📧 Support

- **Copyright**: © 2025 ETAProjects Inc.
- **Contact**: contact@etaprojects.io
- **Legal**: legal@etaprojects.io

---

**Status**: ✅ All tasks completed and pushed to GitHub
**Server**: ✅ Running on port 4422
**Next Step**: Set up Supabase database tables and authentication providers

