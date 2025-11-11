import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Server, ServerData } from "@/types";
import {
  subscribeServers,
  createServer,
  updateServer,
  deleteServer,
} from "@/services/firestoreService";

const ensureServerHasCategories = (server: Server): Server => {
  if (!server.categories || server.categories.length === 0) {
    return {
      ...server,
      categories: [{ id: "cat_1", name: "TEXT MESSAGES" }],
      channels: server.channels?.map((c) => ({
        ...c,
        categoryId: c.categoryId || "cat_1",
      })) || [],
    };
  }
  return {
    ...server,
    channels: server.channels?.map((c) => ({
      ...c,
      categoryId: c.categoryId || "cat_1",
    })) || [],
  };
};

export const useServers = (currentUserId: string | null) => {
  // Load servers from Firestore only, no localStorage
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Subscribe to Firestore servers
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeServers((firestoreServers) => {
      const withCategories = firestoreServers.map(ensureServerHasCategories);
      setServers(withCategories);
      // Removed localStorage sync - data is in Firestore
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateServer = async (serverData: ServerData) => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a server",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const newServer = await createServer(currentUserId, serverData);
      // Firestore listener will automatically update servers
      toast({
        title: "Success",
        description: `Server "${serverData.name}" created successfully`,
      });
      return newServer;
    } catch (error) {
      console.error("Error creating server:", error);
      toast({
        title: "Error",
        description: "Failed to create server",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateServer = async (serverId: string, updates: Partial<Server>) => {
    try {
      await updateServer(serverId, updates);
      // Firestore listener will automatically update servers
      toast({
        title: "Success",
        description: "Server updated successfully",
      });
    } catch (error) {
      console.error("Error updating server:", error);
      toast({
        title: "Error",
        description: "Failed to update server",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    try {
      await deleteServer(serverId);
      // Firestore listener will automatically update servers
      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting server:", error);
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    servers,
    isLoading,
    handleCreateServer,
    handleUpdateServer,
    handleDeleteServer,
    setServers,
  };
};
