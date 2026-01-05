import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dumbbell, Sparkles, Clock, Trophy, Flame, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Recommendations",
      description: "Get personalized exercise routines based on your history and preferences",
    },
    {
      icon: Clock,
      title: "10-15 Minute Sessions",
      description: "Quick, effective desk exercises that fit into your busy schedule",
    },
    {
      icon: Trophy,
      title: "Track Your Progress",
      description: "Log workouts, earn achievements, and watch your fitness grow",
    },
    {
      icon: Flame,
      title: "Build Streaks",
      description: "Stay motivated with daily streaks and milestone celebrations",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-gradient">DeskFit</span>
          </div>
          <Button 
            onClick={() => navigate("/auth")} 
            variant="outline"
            className="hidden sm:flex"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-12 md:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Desk Exercises
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Stay Active at Your Desk with{" "}
            <span className="text-gradient">Personalized Workouts</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            DeskFit recommends quick 10-15 minute exercise routines tailored just for you. 
            Track your progress, build streaks, and earn achievements—all while sitting at your desk.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="gradient-primary hover:opacity-90 text-lg h-14 px-8 shadow-glow"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg h-14 px-8"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-24 p-8 rounded-3xl gradient-card border border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-gradient">12+</p>
              <p className="text-muted-foreground mt-1">Desk Exercises</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gradient">10-15</p>
              <p className="text-muted-foreground mt-1">Min Sessions</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gradient">10+</p>
              <p className="text-muted-foreground mt-1">Achievements</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gradient">AI</p>
              <p className="text-muted-foreground mt-1">Personalized</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Work Breaks?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join DeskFit today and start building healthy habits that fit into your workday.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="gradient-primary hover:opacity-90 text-lg h-14 px-8 shadow-glow"
          >
            Start Your Journey
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container py-8 mt-12 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span className="font-semibold">DeskFit</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DeskFit. Stay active, stay healthy.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
