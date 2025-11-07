import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Upload, X, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Server {
  id: string;
  name: string;
  icon?: string;
  channels?: Channel[];
  categories?: Category[];
}

interface Category {
  id: string;
  name: string;
}

interface Channel {
  id: string;
  name: string;
  type?: "text" | "voice";
  categoryId?: string;
}

const ServerSettings = () => {
  const navigate = useNavigate();
  const { serverId } = useParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultServers: Server[] = [];

  const [servers, setServers] = useState<Server[]>(() => {
    const savedServers = localStorage.getItem("soulVoyageServers");
    return savedServers ? JSON.parse(savedServers) : defaultServers;
  });

  const currentServer = servers.find((s) => s.id === serverId);
  const [editedServerName, setEditedServerName] = useState(currentServer?.name || "");
  const [editedServerIcon, setEditedServerIcon] = useState<string | null>(
    currentServer?.icon || null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);

  if (!currentServer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Server not found</h1>
          <Button onClick={() => navigate("/main")}>Back to Main</Button>
        </div>
      </div>
    );
  }

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditedServerIcon(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    if (!editedServerName.trim()) {
      toast({
        title: "Error",
        description: "Server name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const updatedServers = servers.map((server) =>
      server.id === serverId
        ? {
            ...server,
            name: editedServerName,
            icon: editedServerIcon || undefined,
          }
        : server
    );

    setServers(updatedServers);
    localStorage.setItem("soulVoyageServers", JSON.stringify(updatedServers));

    toast({
      title: "Success",
      description: "Server settings saved successfully",
    });

    navigate("/main?settingsSaved=true");
  };

  const handleDeleteServer = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${editedServerName}"? This action cannot be undone.`
      )
    ) {
      setServers(servers.filter((s) => s.id !== serverId));
      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
      navigate("/main");
    }
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannelToDelete(channelId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteChannel = () => {
    if (!channelToDelete || !serverId) return;

    const updatedServers = servers.map((server) =>
      server.id === serverId
        ? {
            ...server,
            channels: server.channels?.filter((c) => c.id !== channelToDelete) || [],
          }
        : server
    );

    setServers(updatedServers);
    localStorage.setItem("soulVoyageServers", JSON.stringify(updatedServers));
    setDeleteConfirmOpen(false);
    setChannelToDelete(null);

    toast({
      title: "Success",
      description: "Channel deleted successfully",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen">
      {/* Main Settings Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/main")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Server Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="w-full max-w-3xl space-y-8">
            {/* Server Icon Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Server Icon</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full border-2 border-dashed hover:border-primary transition-colors"
                  >
                    {editedServerIcon ? (
                      <Avatar className="w-full h-full">
                        <AvatarImage src={editedServerIcon} />
                      </Avatar>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                  </Button>
                  {editedServerIcon && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full"
                      onClick={() => setEditedServerIcon(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Server Image</p>
                  <p className="text-xs text-muted-foreground">
                    Click to upload a new server icon. If no image is uploaded, the server name
                    initials will be shown.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Server Name Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Server Name</h2>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="server-name">Name</Label>
                <Input
                  id="server-name"
                  placeholder="Enter server name"
                  value={editedServerName}
                  onChange={(e) => setEditedServerName(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {editedServerName.length}/100 characters
                </p>
              </div>
            </div>

            <Separator />

            {/* Server Information Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Server Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Server ID</p>
                  <p className="text-sm font-mono bg-accent/30 p-3 rounded">{currentServer.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Categories</p>
                  <p className="text-sm">
                    {currentServer.categories?.length || 0} category(ies)
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Channels</p>
                  <p className="text-sm">
                    {currentServer.channels?.length || 0} channel(s)
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {new Date(parseInt(currentServer.id)).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Channels Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Channels</h2>
              <div className="space-y-4">
                {currentServer.categories?.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                      {category.name}
                    </h3>
                    <div className="space-y-2">
                      {currentServer.channels
                        ?.filter((c) => c.categoryId === category.id)
                        .map((channel) => (
                          <div
                            key={channel.id}
                            className="flex items-center gap-2 p-3 rounded bg-accent/20 justify-between"
                          >
                            <span className="text-sm">
                              {channel.type === "voice" ? "🎙" : "#"} {channel.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                                {channel.type === "voice" ? "Voice" : "Text"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteChannel(channel.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleSaveSettings}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10"
              >
                Save Changes
              </Button>
              <Button
                onClick={handleDeleteServer}
                variant="destructive"
                className="w-full h-10 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Server
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Channel Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this channel? All chat history will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChannel}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServerSettings;
