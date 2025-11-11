import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Friend, FriendRequest } from "@/types";
import {
  subscribeFriends,
  subscribeFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/services/firestoreService";

export const useFriends = (currentProfileId: string | null) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentProfileId) return;

    const unsubscribeFriends = subscribeFriends(currentProfileId, setFriends);
    const unsubscribeRequests = subscribeFriendRequests(
      currentProfileId,
      setFriendRequests
    );

    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [currentProfileId]);

  const handleSendFriendRequest = async (
    fromUserId: string,
    fromUserName: string,
    toUserId: string
  ) => {
    try {
      await sendFriendRequest(fromUserId, fromUserName, toUserId);
      toast({
        title: "Success",
        description: "Friend request sent!",
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    if (!currentProfileId || !request.fromUserId) return;

    try {
      await acceptFriendRequest(
        request.id,
        currentProfileId,
        request.fromUserId,
        request.fromUserName || request.name
      );
      toast({
        title: "Friend Added",
        description: `${request.name} is now your friend!`,
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      toast({
        title: "Request Rejected",
        description: "Friend request has been rejected",
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

  return {
    friends,
    friendRequests,
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
  };
};
