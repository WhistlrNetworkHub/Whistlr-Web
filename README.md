# Whistlr Web

<p align="center">
  <strong>A modern social platform built with Next.js, TypeScript, Tailwind CSS, and Supabase</strong>
</p>

<p align="center">
  Developed by <strong>ETAProjects Inc.</strong>
</p>

## Features ✨

- **Authentication** with Supabase Auth (Google OAuth & Email/Password)
- **Strongly typed** React components with TypeScript
- Users can create posts, like, repost, and reply
- Users can delete posts, bookmark, and pin posts
- Users can add images to posts
- Users can follow and unfollow other users
- Users can see followers and following lists
- Users can browse all users and trending topics
- **Real-time updates** for likes, reposts, and user profiles
- User profile editing and customization
- **Responsive design** for mobile, tablet, and desktop
- Customizable color schemes and themes
- Image uploads stored on **Supabase Storage**

## Tech Stack 🛠

- [Next.js 15](https://nextjs.org) - React framework
- [TypeScript 5](https://www.typescriptlang.org) - Type safety
- [Tailwind CSS 3](https://tailwindcss.com) - Styling
- [Supabase](https://supabase.com) - Backend & Database
- [SWR](https://swr.vercel.app) - Data fetching
- [Headless UI](https://headlessui.com) - UI components
- [React Hot Toast](https://react-hot-toast.com) - Notifications
- [Framer Motion](https://framer.com) - Animations

## Development 💻

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/WhistlrNetworkHub/Whistlr-Web.git
   cd "Whistlr Web"
   ```

2. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Supabase**

   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up database**

   Run the SQL schema from `SUPABASE_MIGRATION.md` in your Supabase SQL editor

5. **Configure authentication**

   - Enable Google OAuth in Supabase Auth settings
   - Enable Email/Password authentication
   - Set redirect URL to `http://localhost:4422/home`

6. **Create storage bucket**

   - Create a bucket named `tweets`
   - Enable public access for uploaded images

7. **Run the development server**

         ```bash
         npm run dev
         ```

   Open [http://localhost:4422](http://localhost:4422)

## Deployment 🚀

The app is optimized for deployment on Vercel:

         ```bash
npm run build
npm start
```

## License 📄

Copyright © 2025 **ETAProjects Inc.** All rights reserved.

This software is proprietary. Unauthorized copying, modification, or distribution is prohibited.

For licensing inquiries: legal@etaprojects.io

## Support 💬

For issues or questions, please contact: support@etaprojects.io
