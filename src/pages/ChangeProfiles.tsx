import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, UserCircle2, Plus, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ChangeProfiles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentProfile, previousAccounts, user, switchAccount } = useAuth();

  // Debug logging
  console.log("ChangeProfiles - currentProfile:", currentProfile);
  console.log("ChangeProfiles - previousAccounts:", previousAccounts);
  console.log("ChangeProfiles - previousAccounts length:", previousAccounts.length);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSwitchAccount = async (userId: string, email: string, name: string) => {
    toast({
      title: "Switching Account",
      description: `Switching to ${name}...`,
    });
    await switchAccount(userId, email);
    navigate("/login-auth");
  };

  const formatLastLogin = (date?: Date) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter out current profile from previous accounts
  const otherAccounts = previousAccounts.filter(
    (account) => account.userId !== currentProfile?.userId
  );

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
                  <Card className="border-primary bg-primary/5">
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

                  {/* Previously Logged In Accounts */}
                  {otherAccounts.length > 0 && (
                    <>
                      <div className="pt-2">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          Previously Logged In
                        </h3>
                        <div className="space-y-2">
                          {otherAccounts.map((account) => (
                            <Card
                              key={account.userId}
                              className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                              onClick={() => handleSwitchAccount(account.userId, account.email, account.name)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                      <AvatarFallback className="bg-muted">
                                        {getInitials(account.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-semibold">{account.name}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {account.email}
                                      </p>
                                      {account.lastLoginAt && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            {formatLastLogin(account.lastLoginAt)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

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
