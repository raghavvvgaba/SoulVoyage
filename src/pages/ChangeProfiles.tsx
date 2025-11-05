import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isCurrent?: boolean;
}

const ChangeProfiles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
    },
  ]);

  const [currentProfileId, setCurrentProfileId] = useState<string>("1");

  useEffect(() => {
    const savedProfileId = localStorage.getItem("currentProfileId");
    if (savedProfileId) {
      setCurrentProfileId(savedProfileId);
    }
  }, []);

  const handleSwitchProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      localStorage.setItem("currentProfileId", profileId);
      setCurrentProfileId(profileId);
      toast({
        title: "Profile Switched",
        description: `Switched to ${profile.name}'s account`,
      });
      setTimeout(() => navigate("/main"), 500);
    }
  };

  const handleAddProfile = () => {
    navigate("/signup-auth");
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
                Switch between your accounts or add a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Existing Profiles */}
                {profiles.map((profile) => {
                  const isCurrent = profile.id === currentProfileId;
                  return (
                    <Card
                      key={profile.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isCurrent
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => !isCurrent && handleSwitchProfile(profile.id)}
                    >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile.avatarUrl} />
                            <AvatarFallback>
                              {profile.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{profile.name}</h3>
                              {isCurrent && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {profile.email}
                            </p>
                          </div>
                        </div>
                        {isCurrent && (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}

                {/* Add New Profile Button */}
                <Card
                  className="cursor-pointer border-dashed border-2 transition-all hover:shadow-md hover:border-primary"
                  onClick={handleAddProfile}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChangeProfiles;
