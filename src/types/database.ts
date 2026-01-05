export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  total_exercises_completed: number;
  total_minutes_exercised: number;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_seconds: number;
  difficulty: "easy" | "medium" | "hard";
  target_area: string;
  instructions: string[];
  icon: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  exercise_id: string;
  completed_at: string;
  duration_seconds: number;
  difficulty_rating: number | null;
  notes: string | null;
  created_at: string;
  exercise?: Exercise;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface DailyRecommendation {
  id: string;
  user_id: string;
  exercise_ids: string[];
  recommended_date: string;
  created_at: string;
}
