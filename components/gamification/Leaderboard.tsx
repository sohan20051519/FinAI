import React, { useState, useEffect } from 'react';
import { leaderboardService } from '../../services/gamificationService';
import { supabase } from '../../lib/supabase';
import Card from '../ui/Card';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  rank: number | null;
  user_profiles: {
    name: string;
  };
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('weekly');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        const leaderboard = await leaderboardService.getLeaderboard(period, 10);
        setEntries(leaderboard);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [period]);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-xl font-bold text-on-surface mb-4">Leaderboard</h3>
        
        <div className="flex gap-2 mb-4">
          {(['daily', 'weekly', 'monthly', 'all_time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-on-surface-variant">No entries yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const rank = entry.rank || index + 1;
              const isCurrentUser = entry.user_id === currentUserId;
              
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser
                      ? 'bg-primary-container border-2 border-primary'
                      : 'bg-surface-variant/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-on-surface w-8">
                      {getRankEmoji(rank)}
                    </span>
                    <div>
                      <p className={`font-semibold ${isCurrentUser ? 'text-on-primary-container' : 'text-on-surface'}`}>
                        {entry.user_profiles.name}
                        {isCurrentUser && ' (You)'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${isCurrentUser ? 'text-on-primary-container' : 'text-on-surface'}`}>
                    {entry.score.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default Leaderboard;



