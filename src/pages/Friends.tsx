import { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, deleteDoc, doc, Timestamp, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

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
  const { currentProfile, user } = useAuth();
  const currentProfileId = currentProfile?.userId;
  const authUserId = user?.uid;
  
  const [friends, setFriends] = useState<Friend[]>([]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  useEffect(() => {
    // Use Auth UID to load friends (this is where they're stored)
    if (!authUserId) {
      console.log("No auth user ID, cannot load friends");
      return;
    }

    console.log("Loading friends for user:", authUserId);

    try {
      // Load friends from Firestore using Firebase Auth UID
      const userDocRef = doc(db, "users", authUserId);
      const friendsDocRef = collection(userDocRef, "friends");
      
      const unsubscribeFriends = onSnapshot(friendsDocRef, (snapshot) => {
        console.log("Friends snapshot received:", snapshot.docs.length, "friends");
        const firebaseFriends = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        console.log("Friends loaded:", firebaseFriends);
        setFriends(firebaseFriends);
      });

      return () => unsubscribeFriends();
    } catch (error) {
      console.error("Error loading friends from Firestore:", error);
    }
  }, [authUserId]);

  useEffect(() => {
    // Load friend requests using Auth UID
    if (!authUserId) {
      console.log("No auth user ID, cannot load friend requests");
      return;
    }

    console.log("Loading friend requests for user:", authUserId);

    try {
      const friendRequestsRef = collection(db, "friendRequests");
      const q = query(
        friendRequestsRef,
        where("toUserId", "==", authUserId),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("Friend requests snapshot:", snapshot.docs.length, "requests");
        const firestoreFriendRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().fromUserName,
          fromUserId: doc.data().fromUserId,
          fromUserName: doc.data().fromUserName,
        }));
        console.log("Friend requests loaded:", firestoreFriendRequests);
        setFriendRequests(firestoreFriendRequests);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up friend requests listener:", error);
    }
  }, [authUserId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      const request = friendRequests.find(r => r.id === requestId);
      if (!request || !authUserId) {
        console.error("Missing request or authUserId:", { request, authUserId });
        toast({
          title: "Error",
          description: "Invalid request data",
          variant: "destructive",
        });
        return;
      }

      if (!currentProfile) {
        console.error("No current profile found");
        toast({
          title: "Error",
          description: "Profile not loaded. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      console.log("Accepting friend request:", requestId, "from:", request.fromUserId);
      console.log("Current user:", authUserId, currentProfile.name);

      // Add friend to current user's friends list
      const newFriend: Friend = {
        id: request.fromUserId,
        name: request.fromUserName || request.name,
      };

      console.log("Step 1: Adding friend to current user...");
      const userDocRef = doc(db, "users", authUserId);
      const friendsCollectionRef = collection(userDocRef, "friends");
      await setDoc(doc(friendsCollectionRef, newFriend.id), {
        name: newFriend.name,
        addedAt: Timestamp.now(),
      });
      console.log("✅ Friend saved to current user");

      console.log("Step 2: Updating request status...");
      const requestDocRef = doc(db, "friendRequests", requestId);
      await updateDoc(requestDocRef, { status: "accepted" });
      console.log("✅ Request status updated");

      console.log("Step 3: Adding current user to requester's friends...");
      const requesterUserDocRef = doc(db, "users", request.fromUserId);
      const requesterFriendsRef = collection(requesterUserDocRef, "friends");
      await setDoc(doc(requesterFriendsRef, authUserId), {
        name: currentProfile.name,
        addedAt: Timestamp.now(),
      });
      console.log("✅ Added current user to requester's friends");

      // Remove from pending locally
      setFriendRequests(friendRequests.filter(r => r.id !== requestId));

      console.log("✅ Friend request accepted successfully!");
      toast({
        title: "Friend Request Accepted",
        description: `${request.fromUserName || request.name} has been added to your friends`,
      });
    } catch (error: unknown) {
      let description = "Failed to accept friend request";

      if (error instanceof FirebaseError) {
        console.error("❌ Error accepting friend request:", error.code, error.message);
        description = `Failed to accept friend request: ${error.message}`;
      } else if (error instanceof Error) {
        console.error("❌ Error accepting friend request:", error.message);
        description = `Failed to accept friend request: ${error.message}`;
      } else {
        console.error("❌ Error accepting friend request:", error);
      }

      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      const request = friendRequests.find(r => r.id === requestId);

      // Delete from Firestore
      const requestDocRef = doc(db, "friendRequests", requestId);
      await deleteDoc(requestDocRef);

      setFriendRequests(friendRequests.filter(r => r.id !== requestId));

      toast({
        title: "Friend Request Declined",
        description: `Declined request from ${request?.fromUserName || request?.name}`,
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    setFriendToRemove(friend);
    setShowRemoveDialog(true);
  };

  const confirmRemoveFriend = async () => {
    if (!friendToRemove || !authUserId) return;

    try {
      console.log("Removing friend:", friendToRemove.name, "ID:", friendToRemove.id);

      // Delete from current user's friends list in Firestore
      const friendDocRef = doc(db, "users", authUserId, "friends", friendToRemove.id);
      await deleteDoc(friendDocRef);
      console.log("Friend removed from current user");

      // Also remove current user from the friend's friends list (mutual removal)
      const mutualFriendDocRef = doc(db, "users", friendToRemove.id, "friends", authUserId);
      await deleteDoc(mutualFriendDocRef);
      console.log("Current user removed from friend's list");

      // The real-time listener will automatically update the friends list
      toast({
        title: "Friend Removed",
        description: `${friendToRemove.name} has been removed from your friends`,
      });
      
      setShowRemoveDialog(false);
      setFriendToRemove(null);
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
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
