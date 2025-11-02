import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  const calculatePasswordStrength = (pwd: string): "weak" | "moderate" | "strong" => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return "weak";
    if (strength <= 4) return "moderate";
    return "strong";
  };

  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const getStrengthColor = (strength: string | null) => {
    if (!strength) return "bg-muted";
    if (strength === "weak") return "bg-destructive";
    if (strength === "moderate") return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthWidth = (strength: string | null) => {
    if (!strength) return "w-0";
    if (strength === "weak") return "w-1/3";
    if (strength === "moderate") return "w-2/3";
    return "w-full";
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Password must be at least 8 characters long");
    if (!/[a-z]/.test(pwd)) errors.push("Password must contain at least one lowercase letter");
    if (!/[A-Z]/.test(pwd)) errors.push("Password must contain at least one uppercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("Password must contain at least one number");
    if (!/[^a-zA-Z0-9]/.test(pwd)) errors.push("Password must contain at least one special character");
    return errors;
  };

  const handleSignup = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const newErrors: string[] = [];

    if (!firstName.trim()) newErrors.push("First name is required");
    if (!lastName.trim()) newErrors.push("Last name is required");
    if (!email.trim()) newErrors.push("Email is required");

    const passwordErrors = validatePassword(password);
    newErrors.push(...passwordErrors);

    if (password !== confirmPassword) {
      newErrors.push("Passwords entered do not match");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log("Signup successful:", { firstName, middleName, lastName, email });
    setErrors([]);
    setLoggedIn(true);
    setTimeout(() => navigate("/main"), 600);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {loggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-md shadow-lg text-center">
            <h2 className="text-lg font-semibold">Welcome!</h2>
            <p className="text-sm text-muted-foreground mt-2">Taking you to your dashboard…</p>
          </div>
        </div>
      )}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Join soulVoyage and start your adventure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name (Optional)</Label>
                <Input
                  id="middleName"
                  placeholder="Middle name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthColor(
                            passwordStrength
                          )} ${getStrengthWidth(passwordStrength)}`}
                        ></div>
                      </div>
                      <span className="text-xs font-medium capitalize">{passwordStrength}</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className={password.length >= 8 ? "text-green-600 flex items-center gap-1" : "text-muted-foreground"}>
                        {password.length >= 8 && <Check className="w-3 h-3" />}
                        At least 8 characters
                      </div>
                      <div className={/[A-Z]/.test(password) ? "text-green-600 flex items-center gap-1" : "text-muted-foreground"}>
                        {/[A-Z]/.test(password) && <Check className="w-3 h-3" />}
                        One uppercase letter
                      </div>
                      <div className={/[a-z]/.test(password) ? "text-green-600 flex items-center gap-1" : "text-muted-foreground"}>
                        {/[a-z]/.test(password) && <Check className="w-3 h-3" />}
                        One lowercase letter
                      </div>
                      <div className={/[0-9]/.test(password) ? "text-green-600 flex items-center gap-1" : "text-muted-foreground"}>
                        {/[0-9]/.test(password) && <Check className="w-3 h-3" />}
                        One number
                      </div>
                      <div className={/[^a-zA-Z0-9]/.test(password) ? "text-green-600 flex items-center gap-1" : "text-muted-foreground"}>
                        {/[^a-zA-Z0-9]/.test(password) && <Check className="w-3 h-3" />}
                        One special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                type="button"
                className="w-full bg-accent hover:bg-accent/90"
                onClick={() => handleSignup()}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Login here
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
