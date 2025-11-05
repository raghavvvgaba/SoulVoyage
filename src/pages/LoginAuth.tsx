import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Eye, EyeOff, ArrowLeft, Sun, Moon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const LoginAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const stars = useMemo(() => {
    return [...Array(120)].map(() => ({
      width: Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      toast({
        title: "Success",
        description: "Signed in successfully",
      });
      setTimeout(() => navigate("/main"), 500);
    } catch (error: any) {
      setLoading(false);
      let errorMessage = "Failed to sign in";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email or password is incorrect";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error("Login error:", error.code, error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: "Success",
        description: "Signed in with Google successfully",
      });
      setTimeout(() => navigate("/main"), 500);
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };



  return (
    <div className={`h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden ${theme === "dark" ? "bg-gradient-to-br from-slate-950 to-slate-900" : "bg-gradient-to-br from-slate-50 to-slate-100"}`}>
      {/* Starry background effect - only in dark mode */}
      {theme === "dark" && (
        <div className="absolute inset-0 overflow-hidden">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-30"
              style={{
                width: star.width + 'px',
                height: star.height + 'px',
                left: star.left + '%',
                top: star.top + '%',
                animation: `twinkle ${star.duration}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm md:max-w-md lg:max-w-lg">
        <div className={`w-full space-y-2 md:space-y-3 lg:space-y-4 rounded-lg p-3 md:p-5 lg:p-8 shadow-lg relative backdrop-blur-sm ${theme === "dark" ? "bg-slate-900/50 border border-slate-700" : "bg-white/80 border border-slate-200"}`}>
        {/* Back to Home Button - moved to inside form container */}
        <button
          onClick={() => navigate("/")}
          className="absolute -top-12 left-0 z-20 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back to Home</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute -top-12 right-0 z-20 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-sm">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">SoulVoyage</h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base">Sign in to your account</p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-2 md:space-y-2.5 lg:space-y-3">
          <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
            <Label htmlFor="email" className="text-xs md:text-sm lg:text-base">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-8 md:h-9 lg:h-10 text-xs md:text-sm"
            />
          </div>
          <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
            <Label htmlFor="password" className="text-xs md:text-sm lg:text-base">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-8 md:h-9 lg:h-10 text-xs md:text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || !password}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 h-8 md:h-9 lg:h-10 text-xs md:text-sm lg:text-base mt-1"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In with Email"}
          </Button>
        </form>

        <div className="relative my-3 md:my-4 lg:my-5">
          <Separator />
          <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        {/* Google Sign In */}
        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full gap-2 h-8 md:h-9 lg:h-10 text-xs md:text-sm lg:text-base"
          disabled={loading}
        >
          <Chrome className="h-3 md:h-4 lg:h-5 w-3 md:w-4 lg:w-5" />
          {loading ? "Signing in..." : "Sign In with Google"}
        </Button>

        {/* Sign Up Link */}
        <div className="text-center text-xs md:text-sm lg:text-base">
          <p className="text-muted-foreground text-xs">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup-auth")}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </div>
        </div>
      </div>

      {/* Styles for twinkling effect */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        body {
          overflow: hidden;
          height: 100vh;
          width: 100vw;
        }
      `}</style>
    </div>
  );
};

export default LoginAuth;
