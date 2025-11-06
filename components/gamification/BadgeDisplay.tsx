import React from 'react';
import { BADGE_DEFINITIONS } from '../../services/gamificationService';

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  earned_at: string;
  icon?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  showTitle?: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges, showTitle = true }) => {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-on-surface-variant">No badges earned yet. Start saving to earn your first badge! 🎯</p>
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <h3 className="text-xl font-bold text-on-surface mb-4">Achievement Badges</h3>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const badgeDef = BADGE_DEFINITIONS[badge.badge_type as keyof typeof BADGE_DEFINITIONS];
          const icon = badgeDef?.icon || badge.icon || '🏆';
          
          return (
            <div
              key={badge.id}
              className="bg-surface rounded-xl p-4 border border-outline/30 hover:border-primary transition-all cursor-pointer transform hover:scale-105"
              title={badge.badge_description || badge.badge_name}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{icon}</div>
                <h4 className="text-sm font-semibold text-on-surface mb-1">{badge.badge_name}</h4>
                <p className="text-xs text-on-surface-variant line-clamp-2">
                  {badge.badge_description}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-2">
                  {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeDisplay;

