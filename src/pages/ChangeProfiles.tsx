import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, UserCircle2, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const ChangeProfiles = () => {
  const navigate = useNavigate();
  const { currentProfile, user } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Profile and Theme Toggle in top right corner */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ProfileMenu />
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/main")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Main
        </Button>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Change Profiles</CardTitle>
              <CardDescription>
                Switch between accounts or add a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentProfile && user ? (
                <div className="space-y-4">
                  {/* Current Active Profile */}
                  <Card className="border-primary bg-primary/5 cursor-pointer hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(currentProfile.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{currentProfile.name}</h3>
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {currentProfile.email}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Add Another Account */}
                  <Card
                    className="cursor-pointer border-dashed border-2 transition-all hover:shadow-md hover:border-primary"
                    onClick={() => navigate("/login-auth")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                          <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-muted-foreground">
                            Add Another Account
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Sign in with a different account
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCircle2 className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Profile Found</h3>
                  <p className="text-muted-foreground mb-6">
                    Please sign up or log in to see your profile.
                  </p>
                  <Button onClick={() => navigate("/")}>
                    Go to Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChangeProfiles;
