import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background text-foreground overflow-hidden p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-radial-glow pointer-events-none" />

      <div className="relative z-10 text-center max-w-md mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-500 shadow-lg">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            404
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Lost in Code Space</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page at <code className="px-1.5 py-0.5 rounded bg-muted font-mono">{location.pathname}</code> does not exist or was moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto text-xs gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
