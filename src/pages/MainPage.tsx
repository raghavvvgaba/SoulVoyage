import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ServerCreationDialog } from "@/components/ServerCreationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Users, Plus, Send, MessageSquare, ChevronDown, UserCheck, Settings, Layers, Copy, FileText, Image, Video, PieChart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, getDoc, doc, updateDoc, deleteDoc, setDoc, getDocs } from "firebase/firestore";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
  fromUserId?: string;
  fromUserName?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  conversationId: string;
}

interface Server {
  id: string;
  name: string;
  icon?: string;
  channels?: Channel[];
  categories?: Category[];
}

interface Channel {
  id: string;
  name: string;
  type?: "text" | "voice";
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
}

const MainPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showDirectMessages, setShowDirectMessages] = useState(true);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [showServerCreationDialog, setShowServerCreationDialog] = useState(false);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(
    new Set(["1", "2"])
  );
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const [channelType, setChannelType] = useState<"text" | "voice">("text");
  const [channelName, setChannelName] = useState("");
  const [channelError, setChannelError] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [profileTag, setProfileTag] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("soulVoyageMessages");
    return saved ? JSON.parse(saved) : [];
  });
  const currentProfileName = localStorage.getItem("currentProfileName") || "You";
  const wsRef = useRef<WebSocket | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const defaultServers: Server[] = [
    { 
      id: "1", 
      name: "Travel Enthusiasts",
      icon: undefined,
      categories: [
        { id: "cat_1", name: "TEXT MESSAGES" }
      ],
      channels: [
        { id: "1", name: "general", type: "text", categoryId: "cat_1" },
      ]
    },
    { 
      id: "2", 
      name: "Adventure Club",
      icon: undefined,
      categories: [
        { id: "cat_1", name: "TEXT MESSAGES" }
      ],
      channels: [
        { id: "1", name: "general", type: "text", categoryId: "cat_1" },
      ]
    },
  ];

  const ensureServerHasCategories = (server: Server): Server => {
    if (!server.categories || server.categories.length === 0) {
      return {
        ...server,
        categories: [{ id: "cat_1", name: "TEXT MESSAGES" }],
        channels: server.channels?.map(c => ({ ...c, categoryId: c.categoryId || "cat_1" })) || []
      };
    }
    return {
      ...server,
      channels: server.channels?.map(c => ({ ...c, categoryId: c.categoryId || "cat_1" })) || []
    };
  };

  const [servers, setServers] = useState<Server[]>(() => {
    const savedServers = localStorage.getItem("soulVoyageServers");
    const parsed = savedServers ? JSON.parse(savedServers) : defaultServers;
    return parsed.map(ensureServerHasCategories);
  });

  useEffect(() => {
    localStorage.setItem("soulVoyageFriends", JSON.stringify(friends));
  }, [friends]);



  useEffect(() => {
    localStorage.setItem("soulVoyageMessages", JSON.stringify(messages));
  }, [messages]);

  // Initialize WebSocket connection (for sending messages to server)
  useEffect(() => {
    try {
      wsRef.current = new WebSocket("ws://localhost:8081");

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Load friends from Firestore in real-time
  useEffect(() => {
    const currentProfileId = localStorage.getItem("currentProfileId");
    console.log("Current Profile ID:", currentProfileId);
    
    if (!currentProfileId) {
      console.log("No profile ID found");
      return;
    }

    try {
      // Load friends from Firestore
      const userDocRef = doc(db, "users", currentProfileId);
      const friendsDocRef = collection(userDocRef, "friends");
      
      const unsubscribeFriends = onSnapshot(friendsDocRef, (snapshot) => {
        console.log("Friends snapshot:", snapshot.docs.length, "friends found");
        const firebaseFriends = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        console.log("Friends from Firestore:", firebaseFriends);
        setFriends(firebaseFriends);
      });

      return () => unsubscribeFriends();
    } catch (error) {
      console.error("Error loading friends from Firestore:", error);
    }
  }, []);

  // Load friend requests from Firestore in real-time
  useEffect(() => {
    const currentProfileId = localStorage.getItem("currentProfileId");
    
    if (!currentProfileId) {
      console.log("No profile ID found");
      return;
    }

    try {
      const friendRequestsRef = collection(db, "friendRequests");
      const q = query(
        friendRequestsRef,
        where("toUserId", "==", currentProfileId),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const unsubscribeFriendRequests = onSnapshot(q, (snapshot) => {
        console.log("Friend requests snapshot:", snapshot.docs.length, "requests found");
        const firebaseFriendRequests = snapshot.docs.map((doc) => {
          console.log("Friend request:", doc.data());
          return {
            id: doc.id,
            name: doc.data().fromUserName,
            fromUserId: doc.data().fromUserId,
            fromUserName: doc.data().fromUserName,
          };
        });
        setFriendRequests(firebaseFriendRequests);
      });

      return () => unsubscribeFriendRequests();
    } catch (error) {
      console.error("Error setting up friend requests listener:", error);
    }
  }, []);

  // Generate consistent conversation ID
  const getConversationId = (otherUserId: string | undefined) => {
    if (!otherUserId) return "";
    const currentUserId = localStorage.getItem("currentProfileId") || "";
    // Create a sorted, consistent ID that both users will use
    return [currentUserId, otherUserId].sort().join("_");
  };

  // Load messages from Firestore for current conversation
  useEffect(() => {
    let conversationId = "";
    
    if (showDirectMessages && selectedFriend) {
      conversationId = getConversationId(selectedFriend.id);
    } else if (!showDirectMessages && selectedChannel) {
      conversationId = selectedChannel;
    }
    
    console.log("Messages listener setup - conversationId:", conversationId);
    
    if (!conversationId) {
      console.log("No conversation ID, unsubscribing from messages");
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setMessages([]);
      return;
    }

    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));

      console.log("Setting up listener for messages");
      unsubscribeRef.current = onSnapshot(q, (snapshot) => {
        console.log("Messages snapshot received:", snapshot.docs.length, "messages");
        const firestoreMessages = snapshot.docs.map((doc) => {
          console.log("Message:", doc.data());
          return {
            id: doc.id,
            senderId: doc.data().senderId,
            senderName: doc.data().senderName,
            content: doc.data().content,
            timestamp: doc.data().timestamp,
            conversationId: doc.data().conversationId,
          };
        });
        console.log("Setting messages state:", firestoreMessages.length, "messages");
        setMessages(firestoreMessages);
      });
    } catch (error) {
      console.error("Error setting up Firestore listener:", error);
    }

    return () => {
      console.log("Cleaning up messages listener");
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedFriend?.id, selectedChannel, showDirectMessages]);

  useEffect(() => {
    if (searchParams.get("settingsSaved") === "true") {
      toast({
        title: "Success",
        description: "Server settings saved successfully",
      });
      window.history.replaceState({}, document.title, "/main");
    }
  }, [searchParams, toast]);

  const handleServerClick = (serverId: string) => {
    setSelectedServer(serverId);
    setShowDirectMessages(false);
    setSelectedChannel(servers.find(s => s.id === serverId)?.channels?.[0]?.id || null);
  };

  const handleCreateServer = (serverData: { name: string; icon?: string }) => {
    const newServer: Server = {
      id: Date.now().toString(),
      name: serverData.name,
      icon: serverData.icon,
      categories: [{ id: "cat_1", name: "TEXT MESSAGES" }],
      channels: [{ id: "general_1", name: "general", type: "text", categoryId: "cat_1" }],
    };

    const updatedServers = [...servers, newServer];
    setServers(updatedServers);
    localStorage.setItem("soulVoyageServers", JSON.stringify(updatedServers));
    setExpandedServers(new Set([...expandedServers, newServer.id]));
    handleServerClick(newServer.id);
  };

  const toggleChannelsExpanded = (serverId: string) => {
    const newExpandedServers = new Set(expandedServers);
    if (newExpandedServers.has(serverId)) {
      newExpandedServers.delete(serverId);
    } else {
      newExpandedServers.add(serverId);
    }
    setExpandedServers(newExpandedServers);
  };

  const isChannelsExpanded = selectedServer ? expandedServers.has(selectedServer) : false;

  const handleCreateChannel = () => {
    if (!channelName.trim()) {
      setChannelError("Please enter a channel name");
      return;
    }

    if (!selectedServer) return;

    const newChannel: Channel = {
      id: Date.now().toString(),
      name: channelName.toLowerCase().replace(/\s+/g, "-"),
      type: channelType,
      categoryId: selectedCategoryId || "cat_1",
    };

    const updatedServers = servers.map((server) =>
      server.id === selectedServer
        ? { ...server, channels: [...(server.channels || []), newChannel] }
        : server
    );

    setServers(updatedServers);
    localStorage.setItem("soulVoyageServers", JSON.stringify(updatedServers));

    setChannelName("");
    setChannelType("text");
    setChannelError("");
    setShowCreateChannelDialog(false);
    setSelectedCategoryId(null);
    toast({
      title: "Success",
      description: `${channelType === "text" ? "Text" : "Voice"} channel "${newChannel.name}" created!`,
    });
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      setIsCreatingCategory(false);
      setNewCategoryName("");
      return;
    }

    if (!selectedServer) return;

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName,
    };

    const updatedServers = servers.map((server) =>
      server.id === selectedServer
        ? { ...server, categories: [...(server.categories || []), newCategory] }
        : server
    );

    setServers(updatedServers);
    localStorage.setItem("soulVoyageServers", JSON.stringify(updatedServers));

    setNewCategoryName("");
    setIsCreatingCategory(false);
    toast({
      title: "Success",
      description: `Category "${newCategory.name}" created!`,
    });
  };

  const handleChannelClick = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  const currentServer = servers.find(s => s.id === selectedServer);
  const currentChannel = currentServer?.channels?.find(c => c.id === selectedChannel);

  const generateInviteLink = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `https://soul.gg/${code}`;
  };

  const inviteLink = currentServer ? generateInviteLink() : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const handleOpenServerSettings = () => {
    if (selectedServer) {
      navigate(`/server/${selectedServer}/settings`);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      let conversationId = "";
      
      console.log("Send message - showDirectMessages:", showDirectMessages, "selectedFriend:", selectedFriend);
      
      if (showDirectMessages && selectedFriend) {
        conversationId = getConversationId(selectedFriend.id);
      } else if (!showDirectMessages && selectedChannel) {
        conversationId = selectedChannel;
      }
      
      console.log("Conversation ID:", conversationId);
      
      if (!conversationId) {
        console.log("No conversation ID - cannot send message");
        return;
      }

      const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: currentProfileId,
        senderName: currentProfileName,
        content: message,
        timestamp: Date.now(),
        conversationId,
      };
      
      setMessage("");
      
      try {
        console.log("Saving message to Firestore:", newMessage);
        // Save to Firestore (Firestore listener will pick it up automatically)
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        const docRef = await addDoc(messagesRef, {
          ...newMessage,
          timestamp: Timestamp.now(),
        });
        console.log("Message saved successfully with ID:", docRef.id);
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearAllConversations = async () => {
    try {
      console.log("Clearing all conversations...");
      const conversationsRef = collection(db, "conversations");
      const snapshot = await getDocs(conversationsRef);
      
      for (const doc of snapshot.docs) {
        // Delete all messages in this conversation
        const messagesRef = collection(db, "conversations", doc.id, "messages");
        const messagesSnapshot = await getDocs(messagesRef);
        
        for (const msgDoc of messagesSnapshot.docs) {
          await deleteDoc(msgDoc.ref);
        }
        
        // Delete the conversation document itself
        await deleteDoc(doc.ref);
      }
      
      console.log("All conversations cleared!");
      toast({
        title: "Success",
        description: "All conversations have been cleared",
      });
      setMessages([]);
    } catch (error) {
      console.error("Error clearing conversations:", error);
      toast({
        title: "Error",
        description: "Failed to clear conversations",
        variant: "destructive",
      });
    }
  };

  const handleAddFriend = async () => {
    if (!profileTag.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentProfileId = localStorage.getItem("currentProfileId");
      if (!currentProfileId) {
        toast({
          title: "Error",
          description: "No profile selected",
          variant: "destructive",
        });
        return;
      }

      // Search Firestore first
      const userDocRef = doc(db, "users", profileTag.trim().toUpperCase());
      const userDocSnap = await getDoc(userDocRef);

      let foundProfile;
      if (userDocSnap.exists()) {
        foundProfile = userDocSnap.data();
      } else {
        // Fallback to localStorage if not found in Firestore
        const allProfiles = JSON.parse(localStorage.getItem("profiles") || "[]");
        foundProfile = allProfiles.find(
          (p: any) => (p.userId || p.id) === profileTag.trim().toUpperCase()
        );
      }

      if (!foundProfile) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        });
        return;
      }

      const userIdToAdd = foundProfile.userId || foundProfile.id;

      if (currentProfileId === userIdToAdd) {
        toast({
          title: "Error",
          description: "You cannot add yourself",
          variant: "destructive",
        });
        return;
      }

      const alreadyFriend = friends.some((f) => f.id === userIdToAdd);
      if (alreadyFriend) {
        toast({
          title: "Error",
          description: "This user is already your friend",
          variant: "destructive",
        });
        return;
      }

      const currentProfileName = localStorage.getItem("currentProfileName") || "User";

      // Send friend request to Firestore
      await addDoc(collection(db, "friendRequests"), {
        fromUserId: currentProfileId,
        fromUserName: currentProfileName,
        toUserId: userIdToAdd,
        toUserName: foundProfile.name,
        status: "pending",
        createdAt: Timestamp.now(),
      });

      setProfileTag("");
      setShowAddFriendDialog(false);
      toast({
        title: "Friend Request Sent!",
        description: `Friend request sent to ${foundProfile.name}`,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      console.log("Accepting friend request:", requestId);
      
      const request = friendRequests.find(r => r.id === requestId);
      console.log("Found request:", request);
      
      if (!request) {
        console.error("Request not found");
        return;
      }

      const currentProfileId = localStorage.getItem("currentProfileId");
      console.log("Current profile ID:", currentProfileId);
      
      if (!currentProfileId) {
        console.error("No current profile ID");
        return;
      }

      // Add both users as friends
      const newFriend: Friend = {
        id: request.fromUserId || request.id,
        name: request.fromUserName || request.name,
      };

      console.log("New friend:", newFriend);

      // Save friend to Firestore under current user
      const userDocRef = doc(db, "users", currentProfileId);
      const friendsCollectionRef = collection(userDocRef, "friends");
      
      console.log("Saving friend to Firestore...");
      await setDoc(doc(friendsCollectionRef, newFriend.id), {
        name: newFriend.name,
        addedAt: Timestamp.now(),
      });
      console.log("Friend saved to current user");

      // Update request status in Firestore
      const requestDocRef = doc(db, "friendRequests", requestId);
      console.log("Updating request status...");
      await updateDoc(requestDocRef, { status: "accepted" });
      console.log("Request status updated");

      // Also add current user to requester's friends list (reciprocal friendship)
      const requesterUserDocRef = doc(db, "users", request.fromUserId);
      const requesterFriendsRef = collection(requesterUserDocRef, "friends");
      const currentUserName = localStorage.getItem("currentProfileName") || "User";
      
      console.log("Current user name:", currentUserName);
      
      try {
        console.log("Adding current user to requester's friends...");
        await setDoc(doc(requesterFriendsRef, currentProfileId), {
          name: currentUserName,
          addedAt: Timestamp.now(),
        });
        console.log("Added current user to requester's friends");
      } catch (reciprocalError) {
        console.error("Error adding reciprocal friendship:", reciprocalError);
        // Don't fail the whole operation if reciprocal add fails
      }

      // Remove from pending requests
      setFriendRequests(friendRequests.filter(r => r.id !== requestId));

      toast({
        title: "Friend Request Accepted",
        description: `${request.fromUserName || request.name} has been added to your friends`,
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Error",
        description: `Failed to accept friend request: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      const request = friendRequests.find(r => r.id === requestId);

      // Delete request from Firestore
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex h-screen">
      {/* Server Sidebar */}
      <div className="w-[72px] bg-card/50 backdrop-blur-sm border-r border-border flex flex-col items-center py-3 gap-2">
        {/* Direct Messages Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowDirectMessages(true);
            setSelectedServer(null);
            setSelectedChannel(null);
          }}
          className={`w-12 h-12 rounded-2xl transition-all ${
            showDirectMessages
              ? "bg-primary text-primary-foreground rounded-xl"
              : "bg-card hover:bg-accent hover:rounded-xl"
          }`}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>

        <Separator className="w-8" />

        {/* Server Icons */}
        {servers.map((server) => (
          <Button
            key={server.id}
            variant="ghost"
            size="icon"
            onClick={() => handleServerClick(server.id)}
            className={`w-12 h-12 rounded-2xl transition-all p-0 ${
              selectedServer === server.id
                ? "bg-primary text-primary-foreground rounded-xl"
                : "bg-card hover:bg-accent hover:rounded-xl"
            }`}
          >
            {server.icon ? (
              <Avatar className="w-full h-full">
                <AvatarImage src={server.icon} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold rounded-2xl">
                  {getInitials(server.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-sm font-semibold">
                {getInitials(server.name)}
              </span>
            )}
          </Button>
        ))}

        {/* Add Server Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowServerCreationDialog(true)}
          className="w-12 h-12 rounded-2xl bg-card hover:bg-accent hover:rounded-xl transition-all"
        >
          <Plus className="h-6 w-6 text-primary" />
        </Button>
      </div>

      {/* Direct Messages / Channels Sidebar */}
      <div className="w-60 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="h-14 px-4 border-b border-border flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {showDirectMessages ? "Direct Messages" : currentServer?.name}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${showDirectMessages ? "invisible" : ""}`}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setShowInviteDialog(true)}
              >
                <UserCheck className="h-4 w-4" />
                <span>Invite People</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={handleOpenServerSettings}
              >
                <Settings className="h-4 w-4" />
                <span>Server Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setIsCreatingCategory(true)}
              >
                <Layers className="h-4 w-4" />
                <span>Create Category</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showDirectMessages ? (
          <>
            {/* Friend Actions */}
            <div className="p-2 border-b border-border space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-foreground hover:bg-accent/50"
                onClick={() => setShowAddFriendDialog(true)}
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-foreground hover:bg-accent/50 relative"
                onClick={() => navigate("/friends")}
              >
                <Users className="h-4 w-4" />
                Friends
                {friendRequests.length > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      selectedFriend?.id === friend.id
                        ? "bg-accent/50"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(friend.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{friend.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-2">No friends yet</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Categories Section */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {currentServer?.categories?.map((category) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-semibold text-muted-foreground">{category.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setShowCreateChannelDialog(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {currentServer?.channels?.filter(c => c.categoryId === category.id).map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      onClick={() => handleChannelClick(channel.id)}
                      className={`w-full justify-start gap-3 ml-2 ${
                        selectedChannel === channel.id
                          ? "bg-accent/50 hover:bg-accent/50"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm">
                        {channel.type === "voice" ? "🎙" : "#"} {channel.name}
                      </span>
                    </Button>
                  ))}
                </div>
              ))}

              {/* New Category Input */}
              {isCreatingCategory && (
                <div className="px-2 py-1">
                  <Input
                    autoFocus
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onBlur={handleCreateCategory}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCreateCategory();
                      }
                    }}
                    className="text-xs h-7"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-sm">
          <h3 className="text-lg font-semibold">
            {showDirectMessages ? (
              selectedFriend ? selectedFriend.name : "Direct Messages"
            ) : (
              <>
                <span className="text-muted-foreground"># </span>
                {currentChannel?.name}
              </>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(() => {
              let conversationId = "";
              
              if (showDirectMessages && selectedFriend) {
                conversationId = getConversationId(selectedFriend.id);
              } else if (!showDirectMessages && selectedChannel) {
                conversationId = selectedChannel;
              }
              
              console.log("Display - Looking for messages with conversationId:", conversationId);
              const conversationMessages = messages.filter(m => m.conversationId === conversationId);
              console.log("Display - Found", conversationMessages.length, "messages");
              
              if (conversationMessages.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      {showDirectMessages ? (
                        selectedFriend ? (
                          <>
                            <h1 className="text-4xl font-bold mb-2">No messages yet</h1>
                            <p className="text-muted-foreground">
                              Start the conversation with {selectedFriend.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <h1 className="text-4xl font-bold mb-2">Let's get you started</h1>
                            <p className="text-muted-foreground">
                              Select a server, channel, or a DM to begin.
                            </p>
                          </>
                        )
                      ) : (
                        <>
                          <h1 className="text-4xl font-bold mb-2">Welcome to #{currentChannel?.name}</h1>
                          <p className="text-muted-foreground">
                            Start a conversation in this channel.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              
              const currentUserId = localStorage.getItem("currentProfileId");
              console.log("Current User ID for display:", currentUserId);
              return conversationMessages.map((msg) => {
                // Handle both old format (senderId: "current-user") and new format (actual user ID)
                const isCurrentUser = msg.senderId === currentUserId || msg.senderId === "current-user";
                console.log("Message senderId:", msg.senderId, "Current User ID:", currentUserId, "Match:", isCurrentUser);
                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/20 text-foreground"
                    }`}>
                      {!isCurrentUser && (
                        <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                      )}
                      <p className="break-words">{msg.content}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Message Input */}
        {((showDirectMessages && selectedFriend) || (!showDirectMessages && selectedChannel)) && (
          <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-48">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    <span>Files</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Image className="h-4 w-4" />
                    <span>Photos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Video className="h-4 w-4" />
                    <span>Videos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <PieChart className="h-4 w-4" />
                    <span>Poll</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1 relative">
                <Input
                  placeholder={showDirectMessages ? `Message ${selectedFriend?.name}...` : `Message in #${currentChannel?.name}`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-10"
                />
              </div>
              <Button
                size="icon"
                className="rounded-full bg-transparent hover:bg-primary text-primary hover:text-primary-foreground transition-colors"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriendDialog} onOpenChange={setShowAddFriendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
            <DialogDescription>
              Enter a friend's User ID to add them to your friends list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-tag">User ID</Label>
              <Input
                id="profile-tag"
                placeholder="Paste their User ID here..."
                value={profileTag}
                onChange={(e) => setProfileTag(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddFriend();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Ask your friend to share their User ID from Edit Profile
              </p>
            </div>
            <Button
              onClick={handleAddFriend}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              Add Friend
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Server Creation Dialog */}
      <ServerCreationDialog
        open={showServerCreationDialog}
        onOpenChange={setShowServerCreationDialog}
        onServerCreate={handleCreateServer}
      />

      {/* Create Channel Dialog */}
      <Dialog
        open={showCreateChannelDialog}
        onOpenChange={(open) => {
          setShowCreateChannelDialog(open);
          if (!open) setChannelError("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
            <DialogDescription>
              Channels keep conversations organized. Pick a type and give it a name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Channel Type Selection */}
            <div className="space-y-3">
              <Label>Channel Type</Label>
              <RadioGroup value={channelType} onValueChange={(value) => setChannelType(value as "text" | "voice")}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/30 cursor-pointer">
                  <RadioGroupItem value="text" id="text-channel" />
                  <Label htmlFor="text-channel" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold"># Text Channel</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Send messages, images, and more</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/30 cursor-pointer">
                  <RadioGroupItem value="voice" id="voice-channel" />
                  <Label htmlFor="voice-channel" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">🎙 Voice Channel</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Hang out together with voice and video</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Channel Name Input */}
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name *</Label>
              <Input
                id="channel-name"
                placeholder="new-channel"
                value={channelName}
                onChange={(e) => {
                  setChannelName(e.target.value);
                  if (e.target.value.trim()) {
                    setChannelError("");
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateChannel();
                  }
                }}
                className={channelError ? "border-destructive" : ""}
              />
              {channelError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span>ℹ</span>
                  {channelError}
                </p>
              )}
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateChannel}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite People Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite friends to {currentServer?.name}</DialogTitle>
            <DialogDescription>
              Copy and share this invite link to bring people into your community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="h-10 w-10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with your friends to invite them to this server.
            </p>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default MainPage;
