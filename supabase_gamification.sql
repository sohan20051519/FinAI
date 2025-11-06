-- Gamification Tables

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement badges table
CREATE TABLE IF NOT EXISTS achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Daily challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL,
  challenge_type TEXT NOT NULL,
  challenge_title TEXT NOT NULL,
  challenge_description TEXT,
  challenge_goal NUMERIC(12, 2),
  challenge_metric TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_date, challenge_type)
);

-- User challenge progress table
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE NOT NULL,
  progress NUMERIC(12, 2) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- User points/score table
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social features - leaderboard (optional, can be computed)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  period_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period, period_start)
);

-- Social sharing preferences
CREATE TABLE IF NOT EXISTS user_social_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  share_achievements BOOLEAN DEFAULT TRUE,
  share_streaks BOOLEAN DEFAULT TRUE,
  share_challenges BOOLEAN DEFAULT TRUE,
  public_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_badges_user_id ON achievement_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_badges_type ON achievement_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user_id ON user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge_id ON user_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period ON leaderboard_entries(period, period_start);
CREATE INDEX IF NOT EXISTS idx_user_social_settings_user_id ON user_social_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_streaks
DROP POLICY IF EXISTS "Users can view their own streaks" ON user_streaks;
CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own streaks" ON user_streaks;
CREATE POLICY "Users can insert their own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streaks" ON user_streaks;
CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for achievement_badges
DROP POLICY IF EXISTS "Users can view their own badges" ON achievement_badges;
CREATE POLICY "Users can view their own badges"
  ON achievement_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public badges" ON achievement_badges;
CREATE POLICY "Users can view public badges"
  ON achievement_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_social_settings
      WHERE user_social_settings.user_id = achievement_badges.user_id
      AND user_social_settings.public_profile = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can insert their own badges" ON achievement_badges;
CREATE POLICY "Users can insert their own badges"
  ON achievement_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_challenges (readable by all authenticated users)
DROP POLICY IF EXISTS "Users can view daily challenges" ON daily_challenges;
CREATE POLICY "Users can view daily challenges"
  ON daily_challenges FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for user_challenge_progress
DROP POLICY IF EXISTS "Users can view their own challenge progress" ON user_challenge_progress;
CREATE POLICY "Users can view their own challenge progress"
  ON user_challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own challenge progress" ON user_challenge_progress;
CREATE POLICY "Users can insert their own challenge progress"
  ON user_challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenge progress" ON user_challenge_progress;
CREATE POLICY "Users can update their own challenge progress"
  ON user_challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_scores
DROP POLICY IF EXISTS "Users can view their own scores" ON user_scores;
CREATE POLICY "Users can view their own scores"
  ON user_scores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public scores" ON user_scores;
CREATE POLICY "Users can view public scores"
  ON user_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_social_settings
      WHERE user_social_settings.user_id = user_scores.user_id
      AND user_social_settings.public_profile = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can insert their own scores" ON user_scores;
CREATE POLICY "Users can insert their own scores"
  ON user_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scores" ON user_scores;
CREATE POLICY "Users can update their own scores"
  ON user_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for leaderboard_entries (readable by all for leaderboard)
DROP POLICY IF EXISTS "Users can view leaderboard" ON leaderboard_entries;
CREATE POLICY "Users can view leaderboard"
  ON leaderboard_entries FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own leaderboard entries" ON leaderboard_entries;
CREATE POLICY "Users can insert their own leaderboard entries"
  ON leaderboard_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leaderboard entries" ON leaderboard_entries;
CREATE POLICY "Users can update their own leaderboard entries"
  ON leaderboard_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_social_settings
DROP POLICY IF EXISTS "Users can view their own social settings" ON user_social_settings;
CREATE POLICY "Users can view their own social settings"
  ON user_social_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own social settings" ON user_social_settings;
CREATE POLICY "Users can insert their own social settings"
  ON user_social_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own social settings" ON user_social_settings;
CREATE POLICY "Users can update their own social settings"
  ON user_social_settings FOR UPDATE
  USING (auth.uid() = user_id);

