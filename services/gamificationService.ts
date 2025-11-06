import { supabase } from '../lib/supabase';

// Badge types and definitions
export const BADGE_TYPES = {
  FIRST_SAVE: 'first_save',
  WEEK_STREAK: 'week_streak',
  MONTH_STREAK: 'month_streak',
  SAVER_1000: 'saver_1000',
  SAVER_5000: 'saver_5000',
  SAVER_10000: 'saver_10000',
  BUDGET_MASTER: 'budget_master',
  CHALLENGE_CHAMPION: 'challenge_champion',
  CONSISTENT_SAVER: 'consistent_saver',
} as const;

export const BADGE_DEFINITIONS = {
  [BADGE_TYPES.FIRST_SAVE]: {
    name: 'First Save',
    description: 'Made your first savings entry',
    icon: '🎯',
  },
  [BADGE_TYPES.WEEK_STREAK]: {
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    icon: '🔥',
  },
  [BADGE_TYPES.MONTH_STREAK]: {
    name: 'Month Master',
    description: 'Maintained a 30-day streak',
    icon: '⭐',
  },
  [BADGE_TYPES.SAVER_1000]: {
    name: 'Thousand Saver',
    description: 'Saved ₹1,000 total',
    icon: '💰',
  },
  [BADGE_TYPES.SAVER_5000]: {
    name: 'Five K Club',
    description: 'Saved ₹5,000 total',
    icon: '💎',
  },
  [BADGE_TYPES.SAVER_10000]: {
    name: 'Ten K Champion',
    description: 'Saved ₹10,000 total',
    icon: '👑',
  },
  [BADGE_TYPES.BUDGET_MASTER]: {
    name: 'Budget Master',
    description: 'Stayed within budget for a month',
    icon: '📊',
  },
  [BADGE_TYPES.CHALLENGE_CHAMPION]: {
    name: 'Challenge Champion',
    description: 'Completed 10 daily challenges',
    icon: '🏆',
  },
  [BADGE_TYPES.CONSISTENT_SAVER]: {
    name: 'Consistent Saver',
    description: 'Saved money for 14 consecutive days',
    icon: '💪',
  },
};

// Streak Service
export const streakService = {
  async getStreak(userId: string) {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streak:', error);
      return null;
    }

    return data;
  },

  async updateStreak(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const streak = await this.getStreak(userId);

    if (!streak) {
      // Create new streak
      const { data, error } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating streak:', error);
        throw error;
      }

      return data;
    }

    const lastDate = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
    const todayDate = new Date(today);
    const daysDiff = lastDate
      ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let newStreak = streak.current_streak;
    if (daysDiff === 0) {
      // Already updated today
      return streak;
    } else if (daysDiff === 1) {
      // Continue streak
      newStreak = streak.current_streak + 1;
    } else {
      // Reset streak
      newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, streak.longest_streak);

    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating streak:', error);
      throw error;
    }

    return data;
  },
};

// Badge Service
export const badgeService = {
  async getBadges(userId: string) {
    const { data, error } = await supabase
      .from('achievement_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching badges:', error);
      return [];
    }

    return data.map(badge => ({
      ...badge,
      ...BADGE_DEFINITIONS[badge.badge_type as keyof typeof BADGE_DEFINITIONS],
    }));
  },

  async awardBadge(userId: string, badgeType: string) {
    // Check if badge already exists
    const { data: existing } = await supabase
      .from('achievement_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_type', badgeType)
      .single();

    if (existing) {
      return existing; // Already has this badge
    }

    const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
    if (!badgeDef) {
      throw new Error(`Unknown badge type: ${badgeType}`);
    }

    const { data, error } = await supabase
      .from('achievement_badges')
      .insert({
        user_id: userId,
        badge_type: badgeType,
        badge_name: badgeDef.name,
        badge_description: badgeDef.description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }

    return data;
  },

  async checkAndAwardBadges(userId: string, userData: {
    totalSavings?: number;
    streak?: number;
    challengesCompleted?: number;
    daysWithinBudget?: number;
  }) {
    const badgesToAward: string[] = [];

    // Check savings badges
    if (userData.totalSavings) {
      if (userData.totalSavings >= 10000) {
        badgesToAward.push(BADGE_TYPES.SAVER_10000);
      } else if (userData.totalSavings >= 5000) {
        badgesToAward.push(BADGE_TYPES.SAVER_5000);
      } else if (userData.totalSavings >= 1000) {
        badgesToAward.push(BADGE_TYPES.SAVER_1000);
      }
    }

    // Check streak badges
    if (userData.streak) {
      if (userData.streak >= 30) {
        badgesToAward.push(BADGE_TYPES.MONTH_STREAK);
      } else if (userData.streak >= 7) {
        badgesToAward.push(BADGE_TYPES.WEEK_STREAK);
      }
      if (userData.streak >= 14) {
        badgesToAward.push(BADGE_TYPES.CONSISTENT_SAVER);
      }
    }

    // Check challenge badges
    if (userData.challengesCompleted && userData.challengesCompleted >= 10) {
      badgesToAward.push(BADGE_TYPES.CHALLENGE_CHAMPION);
    }

    // Check budget badge
    if (userData.daysWithinBudget && userData.daysWithinBudget >= 30) {
      badgesToAward.push(BADGE_TYPES.BUDGET_MASTER);
    }

    // Award all eligible badges
    const awardedBadges = [];
    for (const badgeType of badgesToAward) {
      try {
        const badge = await this.awardBadge(userId, badgeType);
        awardedBadges.push(badge);
      } catch (error) {
        console.error(`Error awarding badge ${badgeType}:`, error);
      }
    }

    return awardedBadges;
  },
};

// Challenge Service
export const challengeService = {
  async getTodayChallenge() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today challenge:', error);
      return null;
    }

    // If no challenge exists for today, create a default one
    if (!data) {
      return await this.createDefaultChallenge(today);
    }

    return data;
  },

  async createDefaultChallenge(date: string) {
    const challenges = [
      {
        challenge_type: 'save_amount',
        challenge_title: 'Save ₹100 Today',
        challenge_description: 'Save at least ₹100 today to complete this challenge!',
        challenge_goal: 100,
        challenge_metric: 'amount',
      },
      {
        challenge_type: 'track_expense',
        challenge_title: 'Track All Expenses',
        challenge_description: 'Log all your expenses today to stay on track!',
        challenge_goal: 1,
        challenge_metric: 'count',
      },
      {
        challenge_type: 'stay_budget',
        challenge_title: 'Stay Within Budget',
        challenge_description: 'Keep your spending within your daily budget!',
        challenge_goal: 0,
        challenge_metric: 'budget',
      },
    ];

    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

    const { data, error } = await supabase
      .from('daily_challenges')
      .insert({
        challenge_date: date,
        ...randomChallenge,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      return null;
    }

    return data;
  },

  async getUserProgress(userId: string, challengeId: string) {
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching challenge progress:', error);
      return null;
    }

    return data;
  },

  async updateProgress(userId: string, challengeId: string, progress: number, completed: boolean = false) {
    const existing = await this.getUserProgress(userId, challengeId);

    if (existing) {
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .update({
          progress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating challenge progress:', error);
        throw error;
      }

      return data;
    } else {
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          progress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating challenge progress:', error);
        throw error;
      }

      return data;
    }
  },

  async getUserChallenges(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select(`
        *,
        daily_challenges (*)
      `)
      .eq('user_id', userId)
      .gte('daily_challenges.challenge_date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user challenges:', error);
      return [];
    }

    return data;
  },
};

// Score Service
export const scoreService = {
  async getScore(userId: string) {
    const { data, error } = await supabase
      .from('user_scores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching score:', error);
      return null;
    }

    if (!data) {
      // Create initial score
      return await this.createScore(userId);
    }

    return data;
  },

  async createScore(userId: string) {
    const { data, error } = await supabase
      .from('user_scores')
      .insert({
        user_id: userId,
        total_points: 0,
        level: 1,
        experience_points: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating score:', error);
      throw error;
    }

    return data;
  },

  async addPoints(userId: string, points: number) {
    const score = await this.getScore(userId);
    if (!score) return null;

    const newPoints = score.total_points + points;
    const newXP = score.experience_points + points;
    const newLevel = Math.floor(newXP / 1000) + 1; // Level up every 1000 XP

    const { data, error } = await supabase
      .from('user_scores')
      .update({
        total_points: newPoints,
        experience_points: newXP,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating score:', error);
      throw error;
    }

    return data;
  },
};

// Leaderboard Service
export const leaderboardService = {
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all_time', limit: number = 10) {
    const today = new Date();
    let periodStart: string;

    switch (period) {
      case 'daily':
        periodStart = today.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        periodStart = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        periodStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      default:
        periodStart = '2000-01-01';
    }

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user_profiles!inner(name)
      `)
      .eq('period', period)
      .eq('period_start', periodStart)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data;
  },

  async updateLeaderboardEntry(userId: string, score: number, period: 'daily' | 'weekly' | 'monthly' | 'all_time') {
    const today = new Date();
    let periodStart: string;

    switch (period) {
      case 'daily':
        periodStart = today.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        periodStart = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        periodStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      default:
        periodStart = '2000-01-01';
    }

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .upsert({
        user_id: userId,
        score,
        period,
        period_start: periodStart,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,period,period_start',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }

    return data;
  },
};

// Social Settings Service
export const socialService = {
  async getSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_social_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching social settings:', error);
      return null;
    }

    if (!data) {
      // Create default settings
      return await this.createSettings(userId);
    }

    return data;
  },

  async createSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_social_settings')
      .insert({
        user_id: userId,
        share_achievements: true,
        share_streaks: true,
        share_challenges: true,
        public_profile: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating social settings:', error);
      throw error;
    }

    return data;
  },

  async updateSettings(userId: string, settings: {
    share_achievements?: boolean;
    share_streaks?: boolean;
    share_challenges?: boolean;
    public_profile?: boolean;
  }) {
    const { data, error } = await supabase
      .from('user_social_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating social settings:', error);
      throw error;
    }

    return data;
  },
};

