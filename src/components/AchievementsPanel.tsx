import { Achievement, UserAchievement } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Award, 
  Medal, 
  Flame, 
  Zap, 
  Crown, 
  Clock, 
  Timer, 
  TrendingUp,
  Lock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface AchievementsPanelProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  profile: {
    total_exercises_completed: number;
    total_minutes_exercised: number;
    current_streak: number;
  } | null;
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  medal: Medal,
  flame: Flame,
  zap: Zap,
  crown: Crown,
  clock: Clock,
  timer: Timer,
  "trending-up": TrendingUp,
};

export function AchievementsPanel({
  achievements,
  userAchievements,
  profile,
}: AchievementsPanelProps) {
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  const getProgress = (achievement: Achievement): number => {
    if (!profile) return 0;
    
    let current = 0;
    switch (achievement.requirement_type) {
      case "exercises_completed":
        current = profile.total_exercises_completed;
        break;
      case "streak":
        current = profile.current_streak;
        break;
      case "minutes_exercised":
        current = profile.total_minutes_exercised;
        break;
    }
    
    return Math.min((current / achievement.requirement_value) * 100, 100);
  };

  const getRequirementLabel = (achievement: Achievement): string => {
    switch (achievement.requirement_type) {
      case "exercises_completed":
        return `${achievement.requirement_value} exercises`;
      case "streak":
        return `${achievement.requirement_value} day streak`;
      case "minutes_exercised":
        return `${achievement.requirement_value} minutes`;
      default:
        return "";
    }
  };

  const unlockedAchievements = achievements.filter(a => unlockedIds.has(a.id));
  const lockedAchievements = achievements.filter(a => !unlockedIds.has(a.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Achievements
          </CardTitle>
          <Badge variant="secondary">
            {unlockedAchievements.length}/{achievements.length} Unlocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Unlocked
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {unlockedAchievements.map((achievement) => {
                const IconComponent = iconMap[achievement.icon] || Trophy;
                const userAchievement = userAchievements.find(
                  ua => ua.achievement_id === achievement.id
                );
                
                return (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-warning/20 to-accent/20 border border-warning/30 animate-bounce-in"
                  >
                    <div className="w-12 h-12 rounded-xl gradient-streak flex items-center justify-center shadow-md">
                      <IconComponent className="w-6 h-6 text-warning-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{achievement.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {achievement.description}
                      </p>
                      {userAchievement && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlocked {format(parseISO(userAchievement.unlocked_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              In Progress
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {lockedAchievements.map((achievement) => {
                const IconComponent = iconMap[achievement.icon] || Trophy;
                const progress = getProgress(achievement);
                
                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border transition-all",
                      progress > 0 && "hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="font-semibold truncate">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {achievement.description}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{getRequirementLabel(achievement)}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {achievements.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No achievements available yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
