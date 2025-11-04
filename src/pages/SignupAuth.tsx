import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const SignupAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const stars = useMemo(() => {
    return [...Array(120)].map(() => ({
      width: Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength === 0) return "Very Weak";
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-red-500";
    if (strength <= 1) return "bg-orange-500";
    if (strength <= 2) return "bg-yellow-500";
    if (strength <= 3) return "bg-lime-500";
    if (strength <= 4) return "bg-green-500";
    return "bg-emerald-500";
  };

  const validateForm = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return false;
    }
    const strength = getPasswordStrength(password);
    if (strength < 4) {
      toast({
        title: "Error",
        description: "Password must be Strong or Very Strong",
        variant: "destructive",
      });
      return false;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      setTimeout(() => navigate("/main"), 500);
    } catch (error: any) {
      setLoading(false);
      let errorMessage = "Failed to create account";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already registered";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error("Signup error:", error.code, error.message);
    }
  };



  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Starry background effect */}
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

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm md:max-w-md lg:max-w-lg">
        <div className="w-full space-y-2 md:space-y-3 lg:space-y-4 bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 md:p-5 lg:p-8 shadow-lg">
          {/* Header */}
          <div className="text-center space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">SoulVoyage</h1>
            <p className="text-muted-foreground text-xs md:text-sm lg:text-base">Create your account</p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-2 md:space-y-2.5 lg:space-y-3">
            {/* First Name */}
            <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
              <Label htmlFor="first-name" className="text-xs md:text-sm lg:text-base">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first-name"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                className="h-8 md:h-9 lg:h-10 text-xs md:text-sm"
              />
            </div>

            {/* Middle Name */}
            <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
              <Label htmlFor="middle-name" className="text-xs md:text-sm lg:text-base">
                Middle Name <span className="text-gray-500 text-xs">(optional)</span>
              </Label>
              <Input
                id="middle-name"
                type="text"
                placeholder="Michael"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                disabled={loading}
                className="h-8 md:h-9 lg:h-10 text-xs md:text-sm"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
              <Label htmlFor="last-name" className="text-xs md:text-sm lg:text-base">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last-name"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                className="h-8 md:h-9 lg:h-10 text-xs md:text-sm"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
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
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="flex-1 h-1 md:h-1.5 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPasswordStrengthColor(getPasswordStrength(password))} transition-all duration-300`}
                        style={{ width: `${(getPasswordStrength(password) / 6) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">{getPasswordStrengthLabel(getPasswordStrength(password))}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground leading-tight">
                At least 6 chars. Use uppercase, lowercase, numbers, symbols.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
              <Label htmlFor="confirm-password" className="text-xs md:text-sm lg:text-base">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="h-8 md:h-9 lg:h-10 text-xs md:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading || !confirmPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 h-8 md:h-9 lg:h-10 text-xs md:text-sm lg:text-base mt-1"
              disabled={loading || !password || getPasswordStrength(password) < 4}
            >
              {loading ? "Creating..." : password && getPasswordStrength(password) < 4 ? "Password too weak" : "Sign Up with Email"}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-xs md:text-sm lg:text-base">
            <p className="text-muted-foreground text-xs">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login-auth")}
                className="text-primary hover:underline font-medium"
                disabled={loading}
              >
                Sign in
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

export default SignupAuth;
