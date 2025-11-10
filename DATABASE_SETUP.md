# Whistlr Web - Database Setup

## ✅ Using Existing Whistlr Database Schema

This web app is configured to use the **existing Whistlr database schema** that's already set up for the iOS app.

### Database Tables Used

The app connects to these existing tables:

1. **profiles** - User profiles (auto-created on signup via trigger)
2. **posts** - User posts/tweets
3. **comments** - Post comments/replies
4. **follows** - Follow relationships
5. **whistles** - Likes (renamed from likes)
6. **bookmarks** - Saved posts
7. **post_signals** - Engagement metrics

### No Additional Setup Required! 🎉

The database is already fully configured with:
- ✅ All tables created
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-profile creation
- ✅ Real-time subscriptions enabled

### Authentication Flow

1. User signs up with email/password or Google OAuth
2. Supabase Auth creates user in `auth.users`
3. Trigger automatically creates profile in `profiles` table
4. App fetches profile data and user is logged in

### Table Mapping (Twitter → Whistlr)

The app has been updated to use the Whistlr schema:

| Old (Twitter Clone) | New (Whistlr) | Notes |
|---------------------|---------------|-------|
| `users` | `profiles` | User profile data |
| `tweets` | `posts` | User posts |
| `userLikes` | `whistles` | Post likes |
| `userRetweets` | `boosts` | Reposts (via post_signals) |
| `userReplies` | `comments` | Post replies |
| `following[]` | `follows` table | Follow relationships |
| `followers[]` | `follows` table | Follow relationships |

### Environment Variables

Already configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://phdgiqhcidqnfuwxszco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Testing

1. Start the server: `npm run dev`
2. Go to http://localhost:4422
3. Sign up with email or Google
4. Profile is auto-created
5. Start posting!

### Database Schema Reference

For the complete database schema, see:
- `/database/profiles_schema.sql` - Profiles table
- `/database/engagement_system_migration.sql` - Posts, whistles, signals
- `/database/DIRECT_SAFE_OPTIMIZATION.sql` - Follows, bookmarks

All schemas are in the main GrandNational project `/database` folder.

---

**Status**: ✅ Database schema aligned with existing Whistlr infrastructure
**No migration needed**: App uses existing tables

