import { Profile } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Clock, Flame, TrendingUp } from "lucide-react";

interface StatsOverviewProps {
  profile: Profile | null;
}

export function StatsOverview({ profile }: StatsOverviewProps) {
  const stats = [
    {
      label: "Total Exercises",
      value: profile?.total_exercises_completed || 0,
      icon: Dumbbell,
      gradient: "from-primary to-secondary",
    },
    {
      label: "Minutes Exercised",
      value: profile?.total_minutes_exercised || 0,
      icon: Clock,
      gradient: "from-secondary to-accent",
    },
    {
      label: "Current Streak",
      value: profile?.current_streak || 0,
      icon: Flame,
      gradient: "from-accent to-warning",
      suffix: "days",
    },
    {
      label: "Longest Streak",
      value: profile?.longest_streak || 0,
      icon: TrendingUp,
      gradient: "from-warning to-primary",
      suffix: "days",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card 
          key={i} 
          className="overflow-hidden transition-all hover:shadow-soft hover:scale-[1.02]"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {stat.suffix}
                    </span>
                  )}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
