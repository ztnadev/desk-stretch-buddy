import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  useExercises, 
  useProfile, 
  useActivityLogs, 
  useAchievements,
  useGenerateRecommendations 
} from "@/hooks/useExerciseData";
import { Header } from "@/components/Header";
import { StatsOverview } from "@/components/StatsOverview";
import { DailyWorkout } from "@/components/DailyWorkout";
import { WeeklySummary } from "@/components/WeeklySummary";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, Calendar, Trophy } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { exercises, loading: exercisesLoading } = useExercises();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { logs, loading: logsLoading, refetch: refetchLogs } = useActivityLogs();
  const { achievements, userAchievements, loading: achievementsLoading } = useAchievements();
  const { generateRecommendations, loading: generatingRecs } = useGenerateRecommendations();

  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [sessionTheme, setSessionTheme] = useState("Today's Workout");
  const [tip, setTip] = useState("Stay active and take breaks throughout the day!");
  const [hasGeneratedToday, setHasGeneratedToday] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Generate recommendations when data is ready
  const handleGenerateRecommendations = useCallback(async () => {
    if (exercises.length === 0 || generatingRecs) return;

    const result = await generateRecommendations(
      exercises,
      logs,
      profile?.current_streak || 0
    );

    if (result) {
      setRecommendedIds(result.exerciseIds);
      setSessionTheme(result.sessionTheme);
      setTip(result.tip);
      setHasGeneratedToday(true);
    }
  }, [exercises, logs, profile?.current_streak, generateRecommendations, generatingRecs]);

  useEffect(() => {
    if (!exercisesLoading && !logsLoading && !profileLoading && exercises.length > 0 && !hasGeneratedToday) {
      handleGenerateRecommendations();
    }
  }, [exercisesLoading, logsLoading, profileLoading, exercises.length, hasGeneratedToday, handleGenerateRecommendations]);

  const handleExerciseComplete = useCallback(() => {
    refetchProfile();
    refetchLogs();
  }, [refetchProfile, refetchLogs]);

  const isLoading = authLoading || exercisesLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header profile={profile} />
      
      <main className="container py-6 space-y-6">
        {/* Stats Overview */}
        <StatsOverview profile={profile} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="workout" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="workout" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Today's Workout</span>
              <span className="sm:hidden">Workout</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Weekly Summary</span>
              <span className="sm:hidden">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
              <span className="sm:hidden">Badges</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workout" className="mt-6">
            <DailyWorkout
              exercises={exercises}
              recommendedIds={recommendedIds}
              sessionTheme={sessionTheme}
              tip={tip}
              onRefresh={handleGenerateRecommendations}
              isGenerating={generatingRecs}
              onExerciseComplete={handleExerciseComplete}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <WeeklySummary 
              logs={logs} 
              currentStreak={profile?.current_streak || 0} 
            />
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <AchievementsPanel
              achievements={achievements}
              userAchievements={userAchievements}
              profile={profile}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
