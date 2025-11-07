# Gamification Features Setup

## Overview

The FinAI app now includes gamification features to make saving and budgeting more engaging:

- ✅ **Daily Challenges** - Complete daily tasks to earn points
- ✅ **Streaks** - Track consecutive days of activity
- ✅ **Achievement Badges** - Earn badges for milestones
- ✅ **Points & Levels** - Level up as you save more
- ✅ **Leaderboard** - Compete with other users
- ✅ **Social Features** - Share achievements (optional)

## Database Setup

### Step 1: Run the Gamification Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu
2. Click on **SQL Editor** → **New Query**
3. Copy and paste the entire contents of `supabase_gamification.sql`
4. Click **Run** (or press Ctrl+Enter)

### Step 2: Verify Tables Created

After running the SQL, verify these tables exist in **Table Editor**:

- ✅ `user_streaks` - Tracks user activity streaks
- ✅ `achievement_badges` - Stores earned badges
- ✅ `daily_challenges` - Daily challenge definitions
- ✅ `user_challenge_progress` - User progress on challenges
- ✅ `user_scores` - Points, levels, and XP
- ✅ `leaderboard_entries` - Leaderboard rankings
- ✅ `user_social_settings` - Social sharing preferences

## Features

### 1. Daily Challenges

Users get a new challenge every day:
- **Save Amount Challenge** - Save a specific amount
- **Track Expense Challenge** - Log all expenses
- **Stay Within Budget Challenge** - Keep spending under budget

### 2. Streaks

- Tracks consecutive days of activity
- Resets if user misses a day
- Shows current and longest streak
- Awards badges for milestone streaks (7 days, 30 days)

### 3. Achievement Badges

Badges are automatically awarded for:
- 🎯 **First Save** - Made first savings entry
- 🔥 **Week Warrior** - 7-day streak
- ⭐ **Month Master** - 30-day streak
- 💰 **Thousand Saver** - Saved ₹1,000
- 💎 **Five K Club** - Saved ₹5,000
- 👑 **Ten K Champion** - Saved ₹10,000
- 📊 **Budget Master** - Stayed within budget for a month
- 🏆 **Challenge Champion** - Completed 10 challenges
- 💪 **Consistent Saver** - Saved for 14 consecutive days

### 4. Points & Levels

- Earn points for completing challenges, saving money, and maintaining streaks
- Level up every 1000 XP
- Points are displayed on the leaderboard

### 5. Leaderboard

- View rankings by period: Daily, Weekly, Monthly, All-Time
- See your position compared to other users
- Compete with friends (if social features enabled)

### 6. Social Features

Users can:
- Share achievements (optional)
- Make profile public (optional)
- Participate in friendly competitions

## Integration

The gamification features are integrated into the app:

1. **Streaks** - Automatically updated when users log expenses or save money
2. **Badges** - Automatically awarded when milestones are reached
3. **Challenges** - Daily challenges appear in the dashboard
4. **Leaderboard** - Accessible from the gamification dashboard

## Usage

### Viewing Gamification Features

Add the `GamificationDashboard` component to your app:

```tsx
import GamificationDashboard from './components/gamification/GamificationDashboard';

// In your component:
<GamificationDashboard />
```

### Updating Streaks

When a user logs an expense or saves money, update their streak:

```tsx
import { streakService } from './services/gamificationService';

// After user action:
await streakService.updateStreak(userId);
```

### Awarding Badges

Badges are automatically checked and awarded, but you can manually award:

```tsx
import { badgeService } from './services/gamificationService';

// Award a badge:
await badgeService.awardBadge(userId, 'first_save');
```

### Adding Points

When users complete actions, add points:

```tsx
import { scoreService } from './services/gamificationService';

// Add points:
await scoreService.addPoints(userId, 50);
```

## Data Syncing & Backup

All gamification data is automatically synced to Supabase:
- ✅ Streaks are saved and persist across sessions
- ✅ Badges are permanently stored
- ✅ Challenge progress is tracked
- ✅ Scores and levels are synced
- ✅ Leaderboard updates in real-time

## Privacy & Security

- All data uses Row Level Security (RLS)
- Users can only see their own data
- Social features are opt-in only
- Public profiles are disabled by default

## Troubleshooting

If gamification features don't work:
1. Make sure you ran the `supabase_gamification.sql` migration
2. Verify all tables exist in Supabase
3. Check that RLS policies are enabled
4. Ensure user is authenticated



