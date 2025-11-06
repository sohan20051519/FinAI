import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { streakService, badgeService, scoreService } from '../../services/gamificationService';
import StreakDisplay from './StreakDisplay';
import BadgeDisplay from './BadgeDisplay';
import DailyChallenge from './DailyChallenge';
import Leaderboard from './Leaderboard';
import Card from '../ui/Card';

const GamificationDashboard: React.FC = () => {
  const [streak, setStreak] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'challenges' | 'leaderboard'>('overview');

  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [streakData, badgesData, scoreData] = await Promise.all([
          streakService.getStreak(user.id),
          badgeService.getBadges(user.id),
          scoreService.getScore(user.id),
        ]);

        setStreak(streakData);
        setBadges(badgesData);
        setScore(scoreData);
      } catch (error) {
        console.error('Error loading gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGamificationData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline/30">
        {(['overview', 'badges', 'challenges', 'leaderboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Card */}
          {score && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant mb-1">Your Level</p>
                    <h2 className="text-3xl font-bold text-on-surface">Level {score.level}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-on-surface-variant mb-1">Total Points</p>
                    <h2 className="text-3xl font-bold text-primary">{score.total_points.toLocaleString()}</h2>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                    <span>XP Progress</span>
                    <span>{score.experience_points % 1000} / 1000</span>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${((score.experience_points % 1000) / 1000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Streak */}
          <StreakDisplay streak={streak} />

          {/* Recent Badges */}
          {badges.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-bold text-on-surface mb-4">Recent Badges</h3>
                <div className="grid grid-cols-3 gap-3">
                  {badges.slice(0, 3).map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-surface-variant/50 rounded-lg p-3 text-center"
                    >
                      <div className="text-3xl mb-1">{badge.icon || '🏆'}</div>
                      <p className="text-xs font-semibold text-on-surface">{badge.badge_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Daily Challenge Preview */}
          <DailyChallenge />
        </div>
      )}

      {activeTab === 'badges' && (
        <Card>
          <div className="p-4">
            <BadgeDisplay badges={badges} />
          </div>
        </Card>
      )}

      {activeTab === 'challenges' && (
        <DailyChallenge />
      )}

      {activeTab === 'leaderboard' && (
        <Leaderboard />
      )}
    </div>
  );
};

export default GamificationDashboard;

