import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ServerCreationDialog } from "@/components/ServerCreationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Users, Plus, Send, MessageSquare, ChevronDown, UserCheck, Settings, Layers, Copy, FileText, Image, Video, PieChart, Trash2, CheckSquare, X, Globe } from "lucide-react";
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

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  createdBy: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  conversationId: string;
  type?: "text" | "photo" | "poll";
  photoUrl?: string;
  poll?: Poll;
  deletedForEveryone?: boolean;
  deletedFor?: string[];
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
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [messageContextMenu, setMessageContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentProfileName = localStorage.getItem("currentProfileName") || "You";
  const wsRef = useRef<WebSocket | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const defaultServers: Server[] = [];

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

  // Clean up default servers for existing users (one-time migration)
  useEffect(() => {
    const migrationDone = localStorage.getItem("defaultServersMigrated");
    if (!migrationDone) {
      try {
        const savedServers = localStorage.getItem("soulVoyageServers");
        if (savedServers) {
          const parsed = JSON.parse(savedServers);
          // Filter out the default servers (Travel Enthusiasts and Adventure Club)
          const filtered = parsed.filter((s: Server) => 
            s.id !== "1" && s.id !== "2" && 
            s.name !== "Travel Enthusiasts" && 
            s.name !== "Adventure Club"
          );
          localStorage.setItem("soulVoyageServers", JSON.stringify(filtered));
        }
        localStorage.setItem("defaultServersMigrated", "true");
      } catch (error) {
        console.error("Error migrating servers:", error);
      }
    }
  }, []);



  useEffect(() => {
    localStorage.setItem("soulVoyageMessages", JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          const data = doc.data();
          console.log("Message:", data);
          return {
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            content: data.content,
            timestamp: data.timestamp,
            conversationId: data.conversationId,
            type: data.type,
            photoUrl: data.photoUrl,
            poll: data.poll,
            deletedForEveryone: data.deletedForEveryone,
            deletedFor: data.deletedFor,
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoUrl = event.target?.result as string;
        handleSendPhotoMessage(photoUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendPhotoMessage = async (photoUrl: string) => {
    let conversationId = "";
    
    if (showDirectMessages && selectedFriend) {
      conversationId = getConversationId(selectedFriend.id);
    } else if (!showDirectMessages && selectedChannel) {
      conversationId = selectedChannel;
    }
    
    if (!conversationId) return;

    const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentProfileId,
      senderName: currentProfileName,
      content: "📷 Shared a photo",
      timestamp: Date.now(),
      conversationId,
      type: "photo",
      photoUrl,
    };
    
    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      await addDoc(messagesRef, {
        ...newMessage,
        timestamp: Timestamp.now(),
      });
      toast({
        title: "Photo Sent",
        description: "Your photo has been shared",
      });
    } catch (error) {
      console.error("Error sending photo:", error);
      toast({
        title: "Error",
        description: "Failed to send photo",
        variant: "destructive",
      });
    }
  };

  const handleCreatePoll = async () => {
    if (!pollTitle.trim() || pollOptions.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "Poll title and all options must be filled",
        variant: "destructive",
      });
      return;
    }

    let conversationId = "";
    
    if (showDirectMessages && selectedFriend) {
      conversationId = getConversationId(selectedFriend.id);
    } else if (!showDirectMessages && selectedChannel) {
      conversationId = selectedChannel;
    }
    
    if (!conversationId) return;

    const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
    const newPoll: Poll = {
      id: Date.now().toString(),
      title: pollTitle,
      options: pollOptions.map((text, idx) => ({
        id: `opt_${idx}`,
        text,
        votes: [],
      })),
      createdBy: currentProfileId,
    };

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentProfileId,
      senderName: currentProfileName,
      content: `📊 Created a poll: ${pollTitle}`,
      timestamp: Date.now(),
      conversationId,
      type: "poll",
      poll: newPoll,
    };
    
    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      await addDoc(messagesRef, {
        ...newMessage,
        timestamp: Timestamp.now(),
      });
      setPollTitle("");
      setPollOptions(["", ""]);
      setShowPollDialog(false);
      toast({
        title: "Poll Created",
        description: "Your poll has been shared",
      });
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    }
  };

  const handleVotePoll = async (messageId: string, pollOptionId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.poll) return;

    const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
    const pollOptionIndex = message.poll.options.findIndex(opt => opt.id === pollOptionId);
    
    if (pollOptionIndex === -1) return;

    // Remove vote if already voted on this option
    const alreadyVoted = message.poll.options[pollOptionIndex].votes.includes(currentProfileId);
    
    const updatedPoll = {
      ...message.poll,
      options: message.poll.options.map((opt, idx) => ({
        ...opt,
        votes: idx === pollOptionIndex
          ? alreadyVoted 
            ? opt.votes.filter(v => v !== currentProfileId)
            : [...opt.votes, currentProfileId]
          : opt.votes,
      })),
    };

    const updatedMessage = { ...message, poll: updatedPoll };

    try {
      const conversationId = message.conversationId;
      const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
      await updateDoc(messageRef, { poll: updatedPoll });
      
      setMessages(messages.map(m => m.id === messageId ? updatedMessage : m));
    } catch (error) {
      console.error("Error voting on poll:", error);
      toast({
        title: "Error",
        description: "Failed to vote on poll",
        variant: "destructive",
      });
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
      const conversationId = message.conversationId;
      const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
      
      const deletedFor = message.deletedFor || [];
      if (!deletedFor.includes(currentProfileId)) {
        deletedFor.push(currentProfileId);
      }
      
      await updateDoc(messageRef, { deletedFor });
      
      setMessages(messages.filter(m => m.id !== messageId));
      setMessageContextMenu(null);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      
      toast({
        title: "Message Deleted",
        description: "Message removed from your view",
      });
    } catch (error) {
      console.error("Error deleting message for me:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
      
      // Only allow deletion if user is the sender
      if (message.senderId !== currentProfileId) {
        toast({
          title: "Error",
          description: "You can only delete your own messages",
          variant: "destructive",
        });
        return;
      }

      const conversationId = message.conversationId;
      const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
      
      await updateDoc(messageRef, { deletedForEveryone: true });
      
      // Update local state to show the deleted message immediately
      setMessages(messages.map(m => 
        m.id === messageId 
          ? { ...m, deletedForEveryone: true }
          : m
      ));
      setMessageContextMenu(null);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      
      toast({
        title: "Message Deleted",
        description: "Message deleted for everyone",
      });
    } catch (error) {
      console.error("Error deleting message for everyone:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelectedMessages = async () => {
    const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
    
    try {
      for (const messageId of selectedMessages) {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          const conversationId = message.conversationId;
          const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
          
          const deletedFor = message.deletedFor || [];
          if (!deletedFor.includes(currentProfileId)) {
            deletedFor.push(currentProfileId);
          }
          
          await updateDoc(messageRef, { deletedFor });
        }
      }
      
      setMessages(messages.filter(m => !selectedMessages.has(m.id)));
      setSelectedMessages(new Set());
      setDeleteDialogOpen(false);
      setIsDeletingBulk(false);
      
      toast({
        title: "Messages Deleted",
        description: `${selectedMessages.size} message(s) have been removed from your view`,
      });
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast({
        title: "Error",
        description: "Failed to delete messages",
        variant: "destructive",
      });
    }
  };

  const handleMessageRightClick = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    if (selectedMessages.size > 0) {
      // If already in selection mode, toggle this message
      const newSelected = new Set(selectedMessages);
      if (newSelected.has(messageId)) {
        newSelected.delete(messageId);
      } else {
        newSelected.add(messageId);
      }
      setSelectedMessages(newSelected);
      setMessageContextMenu(null);
    } else {
      // Show context menu
      setMessageContextMenu({ messageId, x: e.clientX, y: e.clientY });
    }
  };

  const handleMessageLongPress = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    setMessageContextMenu(null);
  };

  const handleMessageClick = (messageId: string) => {
    if (selectedMessages.size > 0) {
      handleMessageLongPress(messageId);
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

        {/* Globe Icon Button */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-card hover:bg-accent hover:rounded-xl transition-all"
        >
          <Globe className="h-6 w-6 text-primary" />
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
        <div className="flex-1 flex flex-col overflow-hidden" onClick={() => setMessageContextMenu(null)}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 flex flex-col">
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
              
              // Filter out only messages deleted for this specific user
              // Messages with deletedForEveryone should still be visible (showing deletion message)
              const visibleMessages = conversationMessages.filter(msg => {
                if (msg.deletedFor?.includes(currentUserId || "")) return false;
                return true;
              });
              
              return visibleMessages.map((msg) => {
                const isCurrentUser = msg.senderId === currentUserId || msg.senderId === "current-user";
                const isSelected = selectedMessages.has(msg.id);
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"} max-w-full ${
                      isSelected ? "bg-accent/10 rounded-lg px-2 py-1 -mx-2" : ""
                    }`}
                  >
                    {selectedMessages.size > 0 && (
                      <div className="flex items-center pt-1">
                        <div 
                          className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          }`}
                          onClick={() => handleMessageClick(msg.id)}
                        >
                          {isSelected && (
                            <span className="text-primary-foreground text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div
                      onContextMenu={(e) => handleMessageRightClick(e, msg.id)}
                      onTouchStart={() => {
                        longPressTimerRef.current = setTimeout(() => {
                          handleMessageLongPress(msg.id);
                        }, 500);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                      }}
                      onTouchMove={() => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                      }}
                      onClick={() => handleMessageClick(msg.id)}
                      className={`rounded-lg cursor-pointer transition-all max-w-xs ${
                        msg.type === "photo" 
                          ? "p-0"
                          : `px-4 py-2 ${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent/20 text-foreground"
                            }`
                      }`}
                    >
                      {!isCurrentUser && msg.type !== "photo" && msg.type !== "poll" && !msg.deletedForEveryone && (
                        <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                      )}
                      
                      {msg.deletedForEveryone ? (
                        <p className="italic text-muted-foreground text-sm">This message was deleted by the user</p>
                      ) : (
                        <>
                          {msg.type === "photo" && msg.photoUrl && (
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => setFullscreenPhotoUrl(msg.photoUrl || null)}
                            >
                              <img
                                src={msg.photoUrl}
                                alt="Shared photo"
                                className="rounded-lg max-h-64 max-w-xs object-cover hover:opacity-80 transition-opacity"
                              />
                              {!isCurrentUser && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent rounded-b-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-xs text-white font-semibold">{msg.senderName}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {msg.type === "poll" && msg.poll && (
                            <div className="space-y-2">
                              {!isCurrentUser && (
                                <p className="text-xs font-semibold mb-2">{msg.senderName}</p>
                              )}
                              <p className="font-semibold">{msg.poll.title}</p>
                              <div className="space-y-2">
                                {msg.poll.options.map((option) => {
                                  const totalVotes = msg.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                                  const optionVotes = option.votes.length;
                                  const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                                  const hasVoted = option.votes.includes(currentUserId || "");
                                  
                                  return (
                                    <button
                                      key={option.id}
                                      onClick={() => handleVotePoll(msg.id, option.id)}
                                      className={`w-full text-left p-2 rounded transition-all ${
                                        hasVoted
                                          ? "bg-accent/40 border border-accent"
                                          : "bg-accent/20 border border-transparent hover:border-accent/50"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm">{option.text}</span>
                                        <span className="text-xs">{optionVotes}</span>
                                      </div>
                                      <div className="h-1 bg-accent/20 rounded mt-1 overflow-hidden">
                                        <div
                                          className="h-full bg-accent transition-all"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {msg.type !== "photo" && msg.type !== "poll" && (
                            <p className="break-words">{msg.content}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        {((showDirectMessages && selectedFriend) || (!showDirectMessages && selectedChannel)) && (
          <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
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
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Image className="h-4 w-4" />
                    <span>Photos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Video className="h-4 w-4" />
                    <span>Videos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer"
                    onClick={() => setShowPollDialog(true)}
                  >
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
            {selectedMessages.size > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{selectedMessages.size} message(s) selected</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setIsDeletingBulk(true);
                    setDeleteDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
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

      {/* Poll Creation Dialog */}
      <Dialog open={showPollDialog} onOpenChange={setShowPollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Poll</DialogTitle>
            <DialogDescription>
              Create a poll and let others vote on options.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-title">Poll Title</Label>
              <Input
                id="poll-title"
                placeholder="What's your question?"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              {pollOptions.map((option, idx) => (
                <Input
                  key={idx}
                  placeholder={`Option ${idx + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...pollOptions];
                    newOptions[idx] = e.target.value;
                    setPollOptions(newOptions);
                  }}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            </div>

            <Button
              onClick={handleCreatePoll}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Create Poll
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Context Menu */}
      {messageContextMenu && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-fit"
          style={{
            top: Math.min(messageContextMenu.y, window.innerHeight - 150) + 'px',
            left: Math.min(messageContextMenu.x, window.innerWidth - 200) + 'px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
          onMouseLeave={() => setMessageContextMenu(null)}
        >
          {selectedMessages.size === 0 ? (
            <>
              <button
                onClick={() => {
                  const message = messages.find(m => m.id === messageContextMenu.messageId);
                  if (message) {
                    setSelectedMessages(new Set([message.id]));
                  }
                  setMessageContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 text-foreground"
              >
                <CheckSquare className="h-4 w-4" />
                Select Messages
              </button>
              <button
                onClick={() => {
                  setMessageToDelete(messageContextMenu.messageId);
                  setDeleteDialogOpen(true);
                  setMessageContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm hover:bg-destructive/10 flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Message
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setSelectedMessages(new Set());
                setMessageContextMenu(null);
              }}
              className="w-full px-4 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 text-foreground"
            >
              <span className="h-4 w-4">✕</span>
              Cancel Selection
            </button>
          )}
        </div>
      )}

      {/* Delete Message Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setMessageToDelete(null);
            setIsDeletingBulk(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {isDeletingBulk ? "Messages" : "Message"}</DialogTitle>
            <DialogDescription>
              {(() => {
                const currentUserId = localStorage.getItem("currentProfileId");
                
                if (isDeletingBulk) {
                  // Check if all selected messages are owned by current user
                  const allMessagesOwnedByUser = Array.from(selectedMessages).every(msgId => {
                    const msg = messages.find(m => m.id === msgId);
                    return msg?.senderId === currentUserId;
                  });
                  
                  if (allMessagesOwnedByUser) {
                    return `Choose how you want to delete these ${selectedMessages.size} messages.`;
                  } else {
                    return `Delete these ${selectedMessages.size} messages for yourself.`;
                  }
                } else {
                  const message = messageToDelete ? messages.find(m => m.id === messageToDelete) : null;
                  const isMessageOwner = message?.senderId === currentUserId;
                  
                  if (isMessageOwner) {
                    return "Choose how you want to delete this message.";
                  } else {
                    return "Delete this message for yourself.";
                  }
                }
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => {
                if (isDeletingBulk) {
                  handleDeleteSelectedMessages();
                } else if (messageToDelete) {
                  handleDeleteForMe(messageToDelete);
                }
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Delete for Me
            </Button>
            {(() => {
              const currentUserId = localStorage.getItem("currentProfileId");
              
              if (isDeletingBulk) {
                // Check if all selected messages are owned by current user
                const allMessagesOwnedByUser = Array.from(selectedMessages).every(msgId => {
                  const msg = messages.find(m => m.id === msgId);
                  return msg?.senderId === currentUserId;
                });
                
                return allMessagesOwnedByUser && (
                  <Button
                    onClick={async () => {
                      const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
                      try {
                        for (const messageId of selectedMessages) {
                          const message = messages.find(m => m.id === messageId);
                          if (message) {
                            const conversationId = message.conversationId;
                            const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
                            await updateDoc(messageRef, { deletedForEveryone: true });
                          }
                        }
                        
                        // Update local state to show deleted messages immediately
                        setMessages(messages.map(m =>
                          selectedMessages.has(m.id)
                            ? { ...m, deletedForEveryone: true }
                            : m
                        ));
                        setSelectedMessages(new Set());
                        setDeleteDialogOpen(false);
                        setIsDeletingBulk(false);
                        
                        toast({
                          title: "Messages Deleted",
                          description: `${selectedMessages.size} message(s) deleted for everyone`,
                        });
                      } catch (error) {
                        console.error("Error deleting messages for everyone:", error);
                        toast({
                          title: "Error",
                          description: "Failed to delete messages",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full bg-destructive hover:bg-destructive/90"
                  >
                    Delete for Everyone
                  </Button>
                );
              } else {
                const message = messageToDelete ? messages.find(m => m.id === messageToDelete) : null;
                const isMessageOwner = message?.senderId === currentUserId;
                
                return isMessageOwner && (
                  <Button
                    onClick={() => {
                      if (messageToDelete) {
                        handleDeleteForEveryone(messageToDelete);
                      }
                    }}
                    className="w-full bg-destructive hover:bg-destructive/90"
                  >
                    Delete for Everyone
                  </Button>
                );
              }
            })()}
            <Button
              onClick={() => {
                setDeleteDialogOpen(false);
                setMessageToDelete(null);
                setIsDeletingBulk(false);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Viewer */}
      {fullscreenPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreenPhotoUrl(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={fullscreenPhotoUrl}
              alt="Fullscreen photo"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setFullscreenPhotoUrl(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default MainPage;
