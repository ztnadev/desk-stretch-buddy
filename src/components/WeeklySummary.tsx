import { ActivityLog } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Star, TrendingUp, Flame } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

interface WeeklySummaryProps {
  logs: ActivityLog[];
  currentStreak: number;
}

export function WeeklySummary({ logs, currentStreak }: WeeklySummaryProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get this week's logs
  const weekLogs = logs.filter(log => {
    const logDate = parseISO(log.completed_at);
    return logDate >= weekStart && logDate <= weekEnd;
  });

  // Calculate daily activity
  const dailyActivity = daysOfWeek.map(day => {
    const dayLogs = weekLogs.filter(log => isSameDay(parseISO(log.completed_at), day));
    const totalMinutes = dayLogs.reduce((acc, log) => acc + Math.round(log.duration_seconds / 60), 0);
    return {
      date: day,
      exerciseCount: dayLogs.length,
      totalMinutes,
      hasActivity: dayLogs.length > 0,
    };
  });

  // Weekly stats
  const totalExercises = weekLogs.length;
  const totalMinutes = weekLogs.reduce((acc, log) => acc + Math.round(log.duration_seconds / 60), 0);
  const activeDays = dailyActivity.filter(d => d.hasActivity).length;
  const avgRating = weekLogs.filter(l => l.difficulty_rating).length > 0
    ? weekLogs.filter(l => l.difficulty_rating).reduce((acc, l) => acc + (l.difficulty_rating || 0), 0) / 
      weekLogs.filter(l => l.difficulty_rating).length
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Weekly Summary
          </CardTitle>
          {currentStreak > 0 && (
            <Badge variant="outline" className="gradient-streak text-warning-foreground border-0 px-3 py-1">
              <Flame className="w-4 h-4 mr-1" />
              {currentStreak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {dailyActivity.map((day, i) => {
            const isToday = isSameDay(day.date, today);
            const isPast = day.date < today;
            
            return (
              <div key={i} className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  {format(day.date, "EEE")}
                </p>
                <div
                  className={`
                    w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                    ${day.hasActivity 
                      ? "gradient-primary text-primary-foreground shadow-glow" 
                      : isPast 
                        ? "bg-muted text-muted-foreground" 
                        : "bg-muted/50 text-muted-foreground/50"
                    }
                  `}
                >
                  {format(day.date, "d")}
                </div>
                {day.hasActivity && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {day.totalMinutes}m
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{totalExercises}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Clock className="w-5 h-5 mx-auto text-secondary mb-2" />
            <p className="text-2xl font-bold">{totalMinutes}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Calendar className="w-5 h-5 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold">{activeDays}/7</p>
            <p className="text-xs text-muted-foreground">Active Days</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Star className="w-5 h-5 mx-auto text-warning mb-2" />
            <p className="text-2xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "-"}</p>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </div>
        </div>

        {/* Recent Activity */}
        {weekLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {weekLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{log.exercise?.name || "Exercise"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(log.completed_at), "EEE, MMM d 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{Math.round(log.duration_seconds / 60)}m</p>
                    {log.difficulty_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        <span className="text-xs">{log.difficulty_rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {weekLogs.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No activity this week yet.</p>
            <p className="text-sm">Complete your first exercise to see your progress!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
