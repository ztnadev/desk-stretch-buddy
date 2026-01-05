import { Exercise } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Check, 
  Clock, 
  Target,
  Circle,
  ArrowUp,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  ArrowUpCircle,
  Eye,
  Wind,
  ArrowDownCircle,
  ChevronsUp,
  GitBranch,
  Hand
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseCardProps {
  exercise: Exercise;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
  onStart: () => void;
  onComplete: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  circle: Circle,
  "arrow-up": ArrowUp,
  "rotate-ccw": RotateCcw,
  "refresh-cw": RefreshCw,
  "trending-up": TrendingUp,
  "arrow-up-circle": ArrowUpCircle,
  eye: Eye,
  wind: Wind,
  "arrow-down-circle": ArrowDownCircle,
  "chevrons-up": ChevronsUp,
  "git-branch": GitBranch,
  hand: Hand,
};

const difficultyColors = {
  easy: "bg-success/20 text-success border-success/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  hard: "bg-destructive/20 text-destructive border-destructive/30",
};

const categoryColors = {
  stretch: "bg-primary/20 text-primary",
  strength: "bg-accent/20 text-accent",
  relaxation: "bg-secondary/20 text-secondary",
};

export function ExerciseCard({
  exercise,
  isCompleted,
  isActive,
  progress,
  onStart,
  onComplete,
}: ExerciseCardProps) {
  const IconComponent = iconMap[exercise.icon] || Circle;
  const durationMinutes = Math.round(exercise.duration_seconds / 60);

  return (
    <Card
      className={cn(
        "transition-all duration-300 overflow-hidden",
        isCompleted && "opacity-70 bg-success/5 border-success/30",
        isActive && "ring-2 ring-primary shadow-glow scale-[1.02]",
        !isCompleted && !isActive && "hover:shadow-soft hover:scale-[1.01]"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                isCompleted
                  ? "bg-success text-success-foreground"
                  : isActive
                  ? "gradient-primary text-primary-foreground animate-pulse-glow"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="w-6 h-6" />
              ) : (
                <IconComponent className="w-6 h-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">{exercise.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={cn("text-xs", categoryColors[exercise.category as keyof typeof categoryColors])}
                >
                  {exercise.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", difficultyColors[exercise.difficulty])}
                >
                  {exercise.difficulty}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{durationMinutes}m</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{exercise.description}</p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4" />
          <span className="capitalize">{exercise.target_area}</span>
        </div>

        {isActive && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          {isCompleted ? (
            <Button variant="outline" className="w-full" disabled>
              <Check className="w-4 h-4 mr-2" />
              Completed
            </Button>
          ) : isActive ? (
            <Button 
              onClick={onComplete} 
              className="w-full gradient-primary hover:opacity-90"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          ) : (
            <Button 
              onClick={onStart} 
              variant="outline" 
              className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Exercise
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
