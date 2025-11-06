import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/gamificationService';
import { supabase } from '../../lib/supabase';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface Challenge {
  id: string;
  challenge_date: string;
  challenge_type: string;
  challenge_title: string;
  challenge_description: string;
  challenge_goal: number;
  challenge_metric: string;
}

interface ChallengeProgress {
  id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

const DailyChallenge: React.FC = () => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);
        const todayChallenge = await challengeService.getTodayChallenge();
        if (todayChallenge) {
          setChallenge(todayChallenge);
          const userProgress = await challengeService.getUserProgress(user.id, todayChallenge.id);
          setProgress(userProgress || null);
        }
      } catch (error) {
        console.error('Error loading challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenge();
  }, []);

  const handleUpdateProgress = async (newProgress: number) => {
    if (!challenge || !userId) return;

    try {
      const completed = newProgress >= challenge.challenge_goal;
      const updated = await challengeService.updateProgress(
        userId,
        challenge.id,
        newProgress,
        completed
      );
      setProgress(updated);

      if (completed && !progress?.completed) {
        // Award points for completing challenge
        // This would be handled by the score service
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
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

  if (!challenge) {
    return (
      <Card>
        <div className="text-center py-4">
          <p className="text-on-surface-variant">No challenge available today</p>
        </div>
      </Card>
    );
  }

  const progressPercent = Math.min((progress?.progress || 0) / challenge.challenge_goal * 100, 100);
  const isCompleted = progress?.completed || false;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-on-surface">Daily Challenge</h3>
          {isCompleted && (
            <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
              ✓ Completed
            </span>
          )}
        </div>
        
        <h4 className="text-base font-semibold text-on-surface mb-2">{challenge.challenge_title}</h4>
        <p className="text-sm text-on-surface-variant mb-4">{challenge.challenge_description}</p>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-on-surface-variant mb-1">
            <span>Progress</span>
            <span>
              {progress?.progress || 0} / {challenge.challenge_goal}
            </span>
          </div>
          <div className="w-full bg-surface-variant rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                isCompleted ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {!isCompleted && (
          <Button
            onClick={() => handleUpdateProgress((progress?.progress || 0) + 1)}
            className="w-full"
            disabled={loading}
          >
            Update Progress
          </Button>
        )}
      </div>
    </Card>
  );
};

export default DailyChallenge;

