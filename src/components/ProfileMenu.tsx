import { User, LogOut, UserCog, Users } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export function ProfileMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const currentProfileId = localStorage.getItem("currentProfileId");
    const profilesJson = localStorage.getItem("profiles");
    
    if (currentProfileId && profilesJson) {
      try {
        const profiles = JSON.parse(profilesJson);
        const profile = profiles.find((p: Profile) => p.id === currentProfileId);
        setCurrentProfile(profile);
      } catch (e) {
        console.error("Error parsing profiles:", e);
      }
    }
  }, [location]);

  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleChangeProfiles = () => {
    navigate("/change-profiles");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="relative rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={currentProfile?.avatarUrl} />
            <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
              {currentProfile ? getInitials(currentProfile.name) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Open profile menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEditProfile} className="cursor-pointer">
          <UserCog className="mr-2 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleChangeProfiles} className="cursor-pointer">
          <Users className="mr-2 h-4 w-4" />
          <span>Change Profiles</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
