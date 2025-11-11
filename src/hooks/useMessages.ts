import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/types";
import {
  subscribeMessages,
  sendMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  voteOnPoll,
  getConversationId,
} from "@/services/firestoreService";

export const useMessages = (
  selectedFriendId: string | null,
  currentProfileId: string | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!selectedFriendId || !currentProfileId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    const conversationId = getConversationId(currentProfileId, selectedFriendId);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = subscribeMessages(conversationId, (newMessages) => {
      // Filter out messages deleted for current user
      const filteredMessages = newMessages.filter(
        (msg) =>
          !msg.deletedForEveryone &&
          (!msg.deletedFor || !msg.deletedFor.includes(currentProfileId))
      );
      setMessages(filteredMessages);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [selectedFriendId, currentProfileId]);

  const handleSendMessage = async (
    content: string,
    senderName: string,
    type: "text" | "photo" | "poll" = "text",
    additionalData?: { photoUrl?: string; poll?: any }
  ) => {
    if (!selectedFriendId || !currentProfileId || !content.trim()) return;

    try {
      const conversationId = getConversationId(currentProfileId, selectedFriendId);
      await sendMessage(
        conversationId,
        currentProfileId,
        senderName,
        content,
        type,
        additionalData
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessageForMe = async (messageId: string) => {
    if (!selectedFriendId || !currentProfileId) return;

    try {
      const conversationId = getConversationId(currentProfileId, selectedFriendId);
      await deleteMessageForMe(conversationId, messageId, currentProfileId);
      toast({
        title: "Message Deleted",
        description: "Message deleted from your view",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessageForEveryone = async (messageId: string) => {
    if (!selectedFriendId || !currentProfileId) return;

    try {
      const conversationId = getConversationId(currentProfileId, selectedFriendId);
      await deleteMessageForEveryone(conversationId, messageId);
      toast({
        title: "Message Deleted",
        description: "Message deleted for everyone",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeleteMessages = async (
    messageIds: string[],
    deleteForEveryone: boolean
  ) => {
    if (!selectedFriendId || !currentProfileId) return;

    try {
      const conversationId = getConversationId(currentProfileId, selectedFriendId);
      const deletePromises = messageIds.map((messageId) =>
        deleteForEveryone
          ? deleteMessageForEveryone(conversationId, messageId)
          : deleteMessageForMe(conversationId, messageId, currentProfileId)
      );
      await Promise.all(deletePromises);
      toast({
        title: "Messages Deleted",
        description: `${messageIds.length} message(s) deleted`,
      });
    } catch (error) {
      console.error("Error bulk deleting messages:", error);
      toast({
        title: "Error",
        description: "Failed to delete some messages",
        variant: "destructive",
      });
    }
  };

  const handleVoteOnPoll = async (messageId: string, optionId: string) => {
    if (!selectedFriendId || !currentProfileId) return;

    try {
      const conversationId = getConversationId(currentProfileId, selectedFriendId);
      await voteOnPoll(conversationId, messageId, optionId, currentProfileId);
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast({
        title: "Error",
        description: "Failed to vote on poll",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    isLoading,
    handleSendMessage,
    handleDeleteMessageForMe,
    handleDeleteMessageForEveryone,
    handleBulkDeleteMessages,
    handleVoteOnPoll,
  };
};
