import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Check, X, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
}

const Friends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [friends, setFriends] = useState<Friend[]>([
    { id: "1", name: "Sarah Johnson" },
    { id: "2", name: "Mike Chen" },
    { id: "3", name: "Emma Wilson" },
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: "req1", name: "Alex Rivera" },
    { id: "req2", name: "Jordan Smith" },
  ]);

  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    if (request) {
      setFriends([...friends, { id: request.id, name: request.name, avatar: request.avatar }]);
      setFriendRequests(friendRequests.filter(r => r.id !== requestId));
      toast({
        title: "Friend Request Accepted",
        description: `${request.name} has been added to your friends`,
      });
    }
  };

  const handleRejectFriendRequest = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    setFriendRequests(friendRequests.filter(r => r.id !== requestId));
    if (request) {
      toast({
        title: "Friend Request Declined",
        description: `Declined request from ${request.name}`,
      });
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    setFriendToRemove(friend);
    setShowRemoveDialog(true);
  };

  const confirmRemoveFriend = () => {
    if (friendToRemove) {
      setFriends(friends.filter(f => f.id !== friendToRemove.id));
      toast({
        title: "Friend Removed",
        description: `${friendToRemove.name} has been removed from your friends`,
      });
      setShowRemoveDialog(false);
      setFriendToRemove(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="fixed top-0 right-0 left-0 h-14 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/main")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Friends</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <Card className="mb-8 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Friend Requests</CardTitle>
              <CardDescription>
                {friendRequests.length} pending request{friendRequests.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.avatar} />
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {getInitials(request.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{request.name}</p>
                      <p className="text-xs text-muted-foreground">Friend request</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptFriendRequest(request.id)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectFriendRequest(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Friends List Section */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">All Friends</CardTitle>
            <CardDescription>
              {friends.length} friend{friends.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(friend.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{friend.name}</p>
                        <p className="text-xs text-muted-foreground">Online</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFriend(friend)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Go back to Direct Messages to add friends
                </p>
                <Button
                  onClick={() => navigate("/main")}
                  variant="outline"
                >
                  Back to Main
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove Friend Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{friendToRemove?.name}</span> as a friend?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveFriend}
            >
              Remove Friend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Friends;
