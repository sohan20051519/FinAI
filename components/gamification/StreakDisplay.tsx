import React from 'react';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface StreakDisplayProps {
  streak: StreakData | null;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak }) => {
  if (!streak) {
    return (
      <div className="bg-surface rounded-xl p-4 border border-outline/30">
        <div className="text-center">
          <div className="text-3xl mb-2">🔥</div>
          <p className="text-on-surface-variant">Start your streak today!</p>
        </div>
      </div>
    );
  }

  const streakEmoji = streak.current_streak >= 30 ? '⭐' : streak.current_streak >= 7 ? '🔥' : '💪';

  return (
    <div className="bg-gradient-to-br from-primary-container to-secondary-container rounded-xl p-6 border border-primary/20">
      <div className="text-center">
        <div className="text-5xl mb-3">{streakEmoji}</div>
        <h3 className="text-2xl font-bold text-on-primary-container mb-1">
          {streak.current_streak} Day Streak!
        </h3>
        <p className="text-sm text-on-primary-container/80 mb-4">
          Keep it going! You're doing great!
        </p>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-xs text-on-primary-container/70">Current</p>
            <p className="text-lg font-bold text-on-primary-container">{streak.current_streak}</p>
          </div>
          <div className="w-px bg-on-primary-container/30"></div>
          <div className="text-center">
            <p className="text-xs text-on-primary-container/70">Best</p>
            <p className="text-lg font-bold text-on-primary-container">{streak.longest_streak}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;



