import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Exercise, ActivityLog, Profile, Achievement, UserAchievement } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");
      
      if (error) {
        console.error("Error fetching exercises:", error);
      } else {
        setExercises(data as Exercise[]);
      }
      setLoading(false);
    };

    fetchExercises();
  }, []);

  return { exercises, loading };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}

export function useActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, exercise:exercises(*)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("Error fetching activity logs:", error);
    } else {
      setLogs(data as ActivityLog[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value");
      
      if (achievementsError) {
        console.error("Error fetching achievements:", achievementsError);
      } else {
        setAchievements(allAchievements as Achievement[]);
      }

      if (user) {
        const { data: userAchievementsData, error: userAchievementsError } = await supabase
          .from("user_achievements")
          .select("*, achievement:achievements(*)")
          .eq("user_id", user.id);
        
        if (userAchievementsError) {
          console.error("Error fetching user achievements:", userAchievementsError);
        } else {
          setUserAchievements(userAchievementsData as UserAchievement[]);
        }
      }

      setLoading(false);
    };

    fetchAchievements();
  }, [user]);

  return { achievements, userAchievements, loading };
}

export function useCompleteExercise() {
  const { user } = useAuth();
  const { toast } = useToast();

  const completeExercise = async (
    exerciseId: string,
    durationSeconds: number,
    difficultyRating?: number,
    notes?: string
  ) => {
    if (!user) return { success: false };

    // Insert activity log
    const { error: logError } = await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        duration_seconds: durationSeconds,
        difficulty_rating: difficultyRating,
        notes: notes,
      });

    if (logError) {
      console.error("Error logging exercise:", logError);
      toast({
        title: "Error",
        description: "Failed to log exercise. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }

    // Update profile stats
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (currentProfile) {
      const newTotalExercises = (currentProfile.total_exercises_completed || 0) + 1;
      const newTotalMinutes = (currentProfile.total_minutes_exercised || 0) + Math.round(durationSeconds / 60);
      
      // Check if user exercised yesterday to maintain streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const { data: yesterdayLogs } = await supabase
        .from("activity_logs")
        .select("id")
        .eq("user_id", user.id)
        .gte("completed_at", yesterday.toISOString())
        .lt("completed_at", new Date(yesterday.getTime() + 86400000).toISOString())
        .limit(1);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayLogs } = await supabase
        .from("activity_logs")
        .select("id")
        .eq("user_id", user.id)
        .gte("completed_at", today.toISOString())
        .limit(2); // Check if this is the first exercise today

      let newStreak = currentProfile.current_streak || 0;
      
      // If this is the first exercise today
      if (!todayLogs || todayLogs.length <= 1) {
        if (yesterdayLogs && yesterdayLogs.length > 0) {
          // Had exercise yesterday, increment streak
          newStreak += 1;
        } else if (newStreak === 0) {
          // Starting fresh
          newStreak = 1;
        }
        // If no exercise yesterday and streak > 0, it was already reset
      }

      const newLongestStreak = Math.max(currentProfile.longest_streak || 0, newStreak);

      await supabase
        .from("profiles")
        .update({
          total_exercises_completed: newTotalExercises,
          total_minutes_exercised: newTotalMinutes,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
        })
        .eq("user_id", user.id);

      // Check for new achievements
      await checkAndUnlockAchievements(user.id, newTotalExercises, newTotalMinutes, newStreak);
    }

    return { success: true };
  };

  return { completeExercise };
}

async function checkAndUnlockAchievements(
  userId: string,
  totalExercises: number,
  totalMinutes: number,
  currentStreak: number
) {
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");

  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

  for (const achievement of allAchievements || []) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.requirement_type) {
      case "exercises_completed":
        shouldUnlock = totalExercises >= achievement.requirement_value;
        break;
      case "streak":
        shouldUnlock = currentStreak >= achievement.requirement_value;
        break;
      case "minutes_exercised":
        shouldUnlock = totalMinutes >= achievement.requirement_value;
        break;
    }

    if (shouldUnlock) {
      await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        });
    }
  }
}

export function useGenerateRecommendations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async (
    exercises: Exercise[],
    activityLogs: ActivityLog[],
    currentStreak: number
  ): Promise<{ exerciseIds: string[]; sessionTheme: string; tip: string } | null> => {
    if (!user) return null;

    setLoading(true);

    try {
      // Check if we already have recommendations for today
      const today = new Date().toISOString().split("T")[0];
      const { data: existingRecs } = await supabase
        .from("daily_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .eq("recommended_date", today)
        .single();

      if (existingRecs && existingRecs.exercise_ids && existingRecs.exercise_ids.length > 0) {
        setLoading(false);
        return {
          exerciseIds: existingRecs.exercise_ids,
          sessionTheme: "Today's Workout",
          tip: "Keep up the great work!",
        };
      }

      // Get exercise history summary
      const exerciseHistory = activityLogs.reduce((acc, log) => {
        const exercise = exercises.find(e => e.id === log.exercise_id);
        if (exercise) {
          const existing = acc.find(e => e.exercise_name === exercise.name);
          if (existing) {
            existing.completed_count++;
            if (new Date(log.completed_at) > new Date(existing.last_completed)) {
              existing.last_completed = log.completed_at;
            }
          } else {
            acc.push({
              exercise_name: exercise.name,
              completed_count: 1,
              last_completed: log.completed_at,
            });
          }
        }
        return acc;
      }, [] as { exercise_name: string; completed_count: number; last_completed: string }[]);

      // Determine time of day
      const hour = new Date().getHours();
      let timeOfDay = "morning";
      if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17) timeOfDay = "evening";

      const response = await supabase.functions.invoke("generate-exercises", {
        body: {
          exerciseHistory,
          availableExercises: exercises.map(e => ({
            id: e.id,
            name: e.name,
            category: e.category,
            target_area: e.target_area,
            difficulty: e.difficulty,
          })),
          currentStreak,
          timeOfDay,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      // Save recommendations for today
      await supabase.from("daily_recommendations").upsert({
        user_id: user.id,
        exercise_ids: result.exercise_ids,
        recommended_date: today,
      });

      setLoading(false);
      return {
        exerciseIds: result.exercise_ids,
        sessionTheme: result.session_theme,
        tip: result.tip,
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "AI Recommendation Error",
        description: "Using random exercises instead. Please try again later.",
        variant: "destructive",
      });
      
      // Fallback to random exercises
      const shuffled = [...exercises].sort(() => Math.random() - 0.5);
      const fallbackIds = shuffled.slice(0, 5).map(e => e.id);
      
      setLoading(false);
      return {
        exerciseIds: fallbackIds,
        sessionTheme: "Your Daily Workout",
        tip: "Stay active and take breaks throughout the day!",
      };
    }
  };

  return { generateRecommendations, loading };
}
