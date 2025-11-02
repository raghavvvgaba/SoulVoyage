import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Users, Plus, Send, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

interface Server {
  id: string;
  name: string;
  icon?: string;
  channels?: Channel[];
}

interface Channel {
  id: string;
  name: string;
}

const MainPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showDirectMessages, setShowDirectMessages] = useState(true);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [profileTag, setProfileTag] = useState("");
  const [friends, setFriends] = useState<Friend[]>([
    { id: "1", name: "Sarah Johnson" },
    { id: "2", name: "Mike Chen" },
    { id: "3", name: "Emma Wilson" },
  ]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: "req1", name: "Alex Rivera" },
    { id: "req2", name: "Jordan Smith" },
  ]);

  const [servers] = useState<Server[]>([
    { 
      id: "1", 
      name: "Travel Enthusiasts",
      channels: [
        { id: "1", name: "general" },
        { id: "2", name: "destinations" },
        { id: "3", name: "tips-and-tricks" },
      ]
    },
    { 
      id: "2", 
      name: "Adventure Club",
      channels: [
        { id: "1", name: "general" },
        { id: "2", name: "events" },
      ]
    },
  ]);

  const handleServerClick = (serverId: string) => {
    setSelectedServer(serverId);
    setShowDirectMessages(false);
    setSelectedChannel(servers.find(s => s.id === serverId)?.channels?.[0]?.id || null);
  };

  const handleChannelClick = (channelId: string) => {
    setSelectedChannel(channelId);
  };

  const currentServer = servers.find(s => s.id === selectedServer);
  const currentChannel = currentServer?.channels?.find(c => c.id === selectedChannel);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddFriend = () => {
    if (!profileTag.trim()) {
      toast({
        title: "Error",
        description: "Please enter a profile tag",
        variant: "destructive",
      });
      return;
    }

    const newFriend: Friend = {
      id: Date.now().toString(),
      name: profileTag,
    };

    setFriends([...friends, newFriend]);
    setProfileTag("");
    setShowAddFriendDialog(false);
    toast({
      title: "Friend Request Sent",
      description: `Friend request sent to ${profileTag}`,
    });
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
            className={`w-12 h-12 rounded-2xl transition-all ${
              selectedServer === server.id
                ? "bg-primary text-primary-foreground rounded-xl"
                : "bg-card hover:bg-accent hover:rounded-xl"
            }`}
          >
            <span className="text-sm font-semibold">
              {getInitials(server.name)}
            </span>
          </Button>
        ))}

        {/* Add Server Button */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-card hover:bg-accent hover:rounded-xl transition-all"
        >
          <Plus className="h-6 w-6 text-primary" />
        </Button>
      </div>

      {/* Direct Messages / Channels Sidebar */}
      <div className="w-60 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {showDirectMessages ? (
            <h2 className="text-lg font-semibold">Direct Messages</h2>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{currentServer?.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowDirectMessages(true)}
              >
                ✕
              </Button>
            </div>
          )}
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
                <div className="ml-auto flex items-center gap-1">
                  {friendRequests.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {friendRequests.length}
                    </span>
                  )}
                  {friends.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {friends.length}
                    </span>
                  )}
                </div>
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
            {/* Text Channels Section */}
            <div className="p-2 border-b border-border">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-semibold text-muted-foreground">TEXT CHANNELS</span>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto p-2">
              {currentServer?.channels?.map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  onClick={() => handleChannelClick(channel.id)}
                  className={`w-full justify-start gap-3 mb-1 ${
                    selectedChannel === channel.id
                      ? "bg-accent/50 hover:bg-accent/50"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span className="text-sm"># {channel.name}</span>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-sm">
          <h3 className="font-semibold">
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
        <div className="flex-1 flex items-center justify-center">
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

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              disabled={!selectedFriend && showDirectMessages}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder={selectedFriend ? `Message ${selectedFriend.name}...` : "Select a DM to start messaging"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!selectedFriend && showDirectMessages}
                className="pr-10"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleSendMessage}
              disabled={!message.trim() || (!selectedFriend && showDirectMessages)}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriendDialog} onOpenChange={setShowAddFriendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
            <DialogDescription>
              You can add friends with their profile tag.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-tag">Profile Tag</Label>
              <Input
                id="profile-tag"
                placeholder="username#1234"
                value={profileTag}
                onChange={(e) => setProfileTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddFriend();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the exact profile tag with discriminator
              </p>
            </div>
            <Button
              onClick={handleAddFriend}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              Send Friend Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainPage;
