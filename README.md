# 🔧 FlatFix

**Household task management for the Pershing Road crew.**
7 roommates. 1 app. Zero excuses.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) |
| AI | Google Gemini 2.0 Flash API |
| Email | Resend (for digests and recaps) |
| Hosting | Vercel |
| PWA | vite-plugin-pwa |

---

## Setup Guide

### 1. Clone and install

```bash
git clone <your-repo-url>
cd flatfix
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, go to **Settings > API** and copy:
   - **Project URL** (e.g. `https://abcdef.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

3. Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the database schema

1. In Supabase Dashboard, go to **SQL Editor > New Query**.
2. Copy the entire contents of `supabase/schema.sql` and run it.
3. This creates all tables, indexes, RLS policies, triggers, and realtime subscriptions.

### 4. Enable Google Auth

1. In Supabase Dashboard, go to **Authentication > Providers**.
2. Enable **Google** provider.
3. You'll need to create OAuth credentials in Google Cloud Console:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project (or use existing)
   - Go to **APIs & Services > Credentials**
   - Create **OAuth 2.0 Client ID** (Web application)
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret** back into Supabase Google provider settings.

4. (Optional) To restrict to only your 7 roommates' emails, add this check in the
   `handle_new_user()` function in the SQL schema, or add email validation in the app.

### 5. Set up Gemini API (for Smart Composer)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Create an API key (free tier is plenty for 7 users)
3. Store it as a Supabase secret:

```bash
npx supabase secrets set GEMINI_API_KEY=your_gemini_key
```

### 6. Deploy the Edge Function

```bash
npx supabase functions deploy parse-fix
```

### 7. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` on your phone or browser.

### 8. Deploy to Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repo.
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Done!

---

## Folder Structure

```
flatfix/
├── public/
│   └── favicon.svg              # App icon
├── src/
│   ├── components/
│   │   ├── Avatar.jsx           # User avatar with emoji
│   │   ├── BottomNav.jsx        # Bottom navigation bar
│   │   ├── EmptyState.jsx       # Cute empty state displays
│   │   ├── FixCard.jsx          # Individual fix/task card
│   │   ├── Layout.jsx           # App shell with header + nav
│   │   ├── SmartComposer.jsx    # AI-powered fix creation modal
│   │   └── UrgencyBadge.jsx     # Urgency + category badges
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state management
│   ├── data/
│   │   └── avatars.js           # Avatar options + tier system
│   ├── hooks/
│   │   └── useFixes.js          # Real-time data hooks
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   ├── pages/
│   │   ├── Dashboard.jsx        # Leaderboard, streak, recap
│   │   ├── FixBoard.jsx         # Main fix board (home)
│   │   ├── FixHistory.jsx       # Closed fixes history
│   │   ├── Grocery.jsx          # Grocery tracker
│   │   ├── HouseRules.jsx       # Shared house rules
│   │   ├── Login.jsx            # Google sign-in page
│   │   ├── Profile.jsx          # User profile + avatar picker
│   │   ├── Rotations.jsx        # Weekly chore rotations
│   │   └── Templates.jsx        # Reusable fix templates
│   ├── App.jsx                  # Root component with routes
│   ├── index.css                # Global styles + Tailwind
│   └── main.jsx                 # Entry point
├── supabase/
│   ├── functions/
│   │   └── parse-fix/
│   │       └── index.ts         # Gemini AI fix parser
│   └── schema.sql               # Full database schema
├── .env.example                 # Environment variables template
├── index.html                   # HTML shell
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Features

- **Fix Board** — Post, claim, and close household tasks with a Kanban-style board
- **Smart Composer** — Type in natural language, AI structures it into a fix
- **Chore Rotations** — Weekly weighted round-robin assignments
- **Leaderboard** — Weekly ranking with star performer badges
- **House Streak** — Consecutive days with all fixes resolved
- **Avatar System** — 12 cute characters, first come first served
- **Progression Tiers** — Rookie Fixer → Fix God based on stars earned
- **Anonymous Nudges** — Gentle reminders without the awkwardness
- **Appreciation Reactions** — Emoji reactions on closed fixes
- **Grocery Tracker** — "I'm heading out" alerts for store runs
- **House Rules** — Shared, editable household agreements
- **Fix History** — Searchable log of everything that's been fixed
- **Templates** — One-tap reposting for recurring tasks
- **Morning Digest** — Daily email + push notification summary
- **Weekly Recap** — AI-generated fun narrative of the week's activity
- **Dark Mode** — System preference detection
- **PWA** — Installable on phone home screens

---

## Still to build (Phase 2)

These features are designed but not yet implemented in the frontend:

- [ ] Morning digest email (needs Resend integration in Edge Function)
- [ ] Weekly recap generation (scheduled Edge Function + Gemini)
- [ ] AI rotation scheduling (scheduled Edge Function + Gemini)
- [ ] Monthly fairness report
- [ ] Push notifications via FCM or web push
- [ ] Chore swap requests between roommates
- [ ] "Heading out" broadcast notification to other users

---

## Credits

Built by Shubham Kumar and the Pershing Road crew.
