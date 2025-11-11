import { User, LogOut, UserCog, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/context/AuthContext";

export function ProfileMenu() {
  const navigate = useNavigate();
  const { currentProfile, logout } = useAuth();

  // Debug logging
  console.log("ProfileMenu - currentProfile:", currentProfile);

  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
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
