import { useState, useEffect, useCallback } from "react";
import { Exercise } from "@/types/database";
import { ExerciseCard } from "./ExerciseCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, RefreshCw, Clock, Zap, Lightbulb } from "lucide-react";
import { useCompleteExercise } from "@/hooks/useExerciseData";
import { useToast } from "@/hooks/use-toast";

interface DailyWorkoutProps {
  exercises: Exercise[];
  recommendedIds: string[];
  sessionTheme: string;
  tip: string;
  onRefresh: () => void;
  isGenerating: boolean;
  onExerciseComplete: () => void;
}

export function DailyWorkout({
  exercises,
  recommendedIds,
  sessionTheme,
  tip,
  onRefresh,
  isGenerating,
  onExerciseComplete,
}: DailyWorkoutProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, number>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  const { completeExercise } = useCompleteExercise();
  const { toast } = useToast();

  const recommendedExercises = recommendedIds
    .map(id => exercises.find(e => e.id === id))
    .filter((e): e is Exercise => e !== undefined);

  const totalDuration = recommendedExercises.reduce((acc, e) => acc + e.duration_seconds, 0);
  const completedDuration = recommendedExercises
    .filter(e => completedIds.has(e.id))
    .reduce((acc, e) => acc + e.duration_seconds, 0);
  const overallProgress = totalDuration > 0 ? (completedDuration / totalDuration) * 100 : 0;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (activeExerciseId) {
      const activeExercise = recommendedExercises.find(e => e.id === activeExerciseId);
      if (activeExercise) {
        interval = setInterval(() => {
          setTimerSeconds(prev => {
            const newSeconds = prev + 1;
            const progress = (newSeconds / activeExercise.duration_seconds) * 100;
            setExerciseProgress(p => ({ ...p, [activeExerciseId]: Math.min(progress, 100) }));
            return newSeconds;
          });
        }, 1000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeExerciseId, recommendedExercises]);

  const handleStartExercise = useCallback((exerciseId: string) => {
    setActiveExerciseId(exerciseId);
    setTimerSeconds(0);
    setExerciseProgress(p => ({ ...p, [exerciseId]: 0 }));
  }, []);

  const handleCompleteExercise = useCallback(async (exerciseId: string) => {
    const exercise = recommendedExercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const result = await completeExercise(exerciseId, exercise.duration_seconds);
    
    if (result.success) {
      setCompletedIds(prev => new Set([...prev, exerciseId]));
      setActiveExerciseId(null);
      setTimerSeconds(0);
      onExerciseComplete();

      toast({
        title: "Exercise completed! 💪",
        description: `Great job finishing ${exercise.name}!`,
      });

      // Check if all exercises are completed
      if (completedIds.size + 1 === recommendedExercises.length) {
        toast({
          title: "Workout Complete! 🎉",
          description: "You've finished today's workout. Amazing work!",
        });
      }
    }
  }, [completeExercise, recommendedExercises, completedIds.size, toast, onExerciseComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (recommendedExercises.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Sparkles className="w-16 h-16 mx-auto text-primary mb-4 animate-float" />
          <h3 className="text-xl font-semibold mb-2">Generating Your Workout...</h3>
          <p className="text-muted-foreground mb-4">
            Our AI is creating a personalized exercise routine just for you.
          </p>
          <Button onClick={onRefresh} disabled={isGenerating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Generate Exercises"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card className="gradient-card border-0 shadow-soft overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered</span>
              </div>
              <CardTitle className="text-2xl">{sessionTheme}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isGenerating}
              className="hover:bg-primary/10"
            >
              <RefreshCw className={`w-5 h-5 ${isGenerating ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold">{Math.round(totalDuration / 60)}</p>
              <p className="text-xs text-muted-foreground">minutes</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold">{recommendedExercises.length}</p>
              <p className="text-xs text-muted-foreground">exercises</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Lightbulb className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold">{completedIds.size}</p>
              <p className="text-xs text-muted-foreground">completed</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session Progress</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{tip}</p>
          </div>

          {/* Active Timer */}
          {activeExerciseId && (
            <div className="flex items-center justify-center gap-2 py-4 rounded-lg gradient-primary text-primary-foreground animate-fade-in">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-mono font-bold">{formatTime(timerSeconds)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="grid gap-4 md:grid-cols-2">
        {recommendedExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isCompleted={completedIds.has(exercise.id)}
            isActive={activeExerciseId === exercise.id}
            progress={exerciseProgress[exercise.id] || 0}
            onStart={() => handleStartExercise(exercise.id)}
            onComplete={() => handleCompleteExercise(exercise.id)}
          />
        ))}
      </div>
    </div>
  );
}
