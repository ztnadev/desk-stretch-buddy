-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_exercises_completed INTEGER NOT NULL DEFAULT 0,
  total_minutes_exercised INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises library table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 120,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  target_area TEXT NOT NULL,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT 'dumbbell',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements junction table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily recommendations table (to track what was recommended each day)
CREATE TABLE public.daily_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_ids UUID[] NOT NULL DEFAULT '{}',
  recommended_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recommended_date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exercises policies (public read for exercise library)
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activity logs" ON public.activity_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activity logs" ON public.activity_logs FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily recommendations policies
CREATE POLICY "Users can view their own recommendations" ON public.daily_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recommendations" ON public.daily_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recommendations" ON public.daily_recommendations FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default exercises
INSERT INTO public.exercises (name, description, category, duration_seconds, difficulty, target_area, instructions, icon) VALUES
('Neck Rolls', 'Gentle circular movements to release neck tension', 'stretch', 60, 'easy', 'neck', ARRAY['Sit up straight', 'Drop chin to chest', 'Slowly roll head to the right', 'Continue around to the back', 'Roll to the left and back to start', 'Repeat 5 times each direction'], 'circle'),
('Shoulder Shrugs', 'Simple shoulder raises to release upper body tension', 'strength', 90, 'easy', 'shoulders', ARRAY['Sit or stand with arms relaxed', 'Raise both shoulders toward ears', 'Hold for 2 seconds', 'Release and let shoulders drop', 'Repeat 10-15 times'], 'arrow-up'),
('Seated Spinal Twist', 'Gentle twist to improve spine mobility', 'stretch', 120, 'easy', 'back', ARRAY['Sit up tall in your chair', 'Place right hand on left knee', 'Twist torso to the left', 'Hold for 15-20 seconds', 'Return to center', 'Repeat on other side'], 'rotate-ccw'),
('Wrist Circles', 'Circular wrist movements to prevent strain', 'stretch', 60, 'easy', 'wrists', ARRAY['Extend arms in front of you', 'Make fists with both hands', 'Rotate wrists clockwise 10 times', 'Rotate counter-clockwise 10 times', 'Shake hands gently to finish'], 'refresh-cw'),
('Desk Push-Ups', 'Modified push-ups using your desk for support', 'strength', 120, 'medium', 'arms', ARRAY['Stand facing desk at arm''s length', 'Place hands on desk edge shoulder-width apart', 'Lower chest toward desk', 'Push back up to starting position', 'Repeat 10-15 times'], 'trending-up'),
('Seated Leg Raises', 'Leg lifts while seated to engage core', 'strength', 90, 'medium', 'legs', ARRAY['Sit at edge of chair', 'Grip sides for support', 'Lift both legs straight out', 'Hold for 5 seconds', 'Lower slowly', 'Repeat 10-12 times'], 'arrow-up-circle'),
('Eye Relaxation', 'Eye exercises to reduce screen strain', 'relaxation', 60, 'easy', 'eyes', ARRAY['Close eyes for 20 seconds', 'Open and look at something 20 feet away', 'Hold for 20 seconds', 'Blink rapidly 20 times', 'Repeat cycle 3 times'], 'eye'),
('Deep Breathing', 'Calming breath work for stress relief', 'relaxation', 120, 'easy', 'breathing', ARRAY['Sit comfortably with feet flat', 'Inhale deeply through nose for 4 counts', 'Hold for 4 counts', 'Exhale slowly through mouth for 6 counts', 'Repeat 5-10 times'], 'wind'),
('Chair Squats', 'Stand up and sit down to strengthen legs', 'strength', 120, 'medium', 'legs', ARRAY['Stand in front of chair', 'Lower yourself slowly until seated', 'Stand back up without using hands', 'Keep core engaged throughout', 'Repeat 15-20 times'], 'arrow-down-circle'),
('Calf Raises', 'Simple heel raises for lower leg strength', 'strength', 90, 'easy', 'legs', ARRAY['Stand behind chair holding back', 'Rise up on toes as high as possible', 'Hold for 2 seconds', 'Lower heels slowly', 'Repeat 15-20 times'], 'chevrons-up'),
('Seated Hip Stretch', 'Figure-four stretch for hip flexibility', 'stretch', 120, 'easy', 'hips', ARRAY['Sit at edge of chair', 'Cross right ankle over left knee', 'Keep back straight and lean forward slightly', 'Hold for 20-30 seconds', 'Switch legs and repeat'], 'git-branch'),
('Hand Stretches', 'Finger and palm stretches for typing relief', 'stretch', 60, 'easy', 'hands', ARRAY['Extend arms and spread fingers wide', 'Hold for 5 seconds', 'Make tight fists', 'Hold for 5 seconds', 'Repeat 5 times', 'Shake hands out'], 'hand');

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first exercise', 'trophy', 'exercises_completed', 1),
('Getting Started', 'Complete 10 exercises', 'star', 'exercises_completed', 10),
('Dedicated', 'Complete 50 exercises', 'award', 'exercises_completed', 50),
('Century Club', 'Complete 100 exercises', 'medal', 'exercises_completed', 100),
('Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 7),
('Fortnight Fighter', 'Maintain a 14-day streak', 'zap', 'streak', 14),
('Monthly Master', 'Maintain a 30-day streak', 'crown', 'streak', 30),
('Quick Session', 'Exercise for 10 minutes total', 'clock', 'minutes_exercised', 10),
('Hour Power', 'Exercise for 60 minutes total', 'timer', 'minutes_exercised', 60),
('Marathon Mind', 'Exercise for 300 minutes total', 'trending-up', 'minutes_exercised', 300);