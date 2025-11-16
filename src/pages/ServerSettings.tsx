import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Upload, X, ArrowLeft, Trash2, Layers, Pencil, Check } from "lucide-react";
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

  // Load servers from Firestore, not localStorage
  const [servers, setServers] = useState<Server[]>(defaultServers);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  
  const [editedServerName, setEditedServerName] = useState("");
  const [editedServerIcon, setEditedServerIcon] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteServerConfirmOpen, setDeleteServerConfirmOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);
  const [deleteCategoryConfirmOpen, setDeleteCategoryConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [serverOwner, setServerOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [editedChannelName, setEditedChannelName] = useState("");

  // Load server from Firestore and check ownership
  useEffect(() => {
    const loadServer = async () => {
      try {
        if (!serverId) {
          setLoading(false);
          return;
        }
        
        console.log("Loading server:", serverId);
        const serverDoc = await getDoc(doc(db, "servers", serverId));
        
        if (serverDoc.exists()) {
          const serverData = serverDoc.data();
          const server: Server = {
            id: serverDoc.id,
            name: serverData.name || "",
            icon: serverData.icon || "",
            channels: serverData.channels || [],
            categories: serverData.categories || [],
          };
          
          console.log("Server loaded:", server);
          setCurrentServer(server);
          setServers([server]); // Set servers array for compatibility
          setEditedServerName(server.name);
          setEditedServerIcon(server.icon || null);
          
          // Check ownership
          const owner = serverData.owner;
          setServerOwner(owner);
          const currentUserId = auth.currentUser?.uid;
          setIsOwner(owner === currentUserId);
        } else {
          console.log("Server not found:", serverId);
          setCurrentServer(null);
        }
      } catch (error) {
        console.error("Error loading server:", error);
      } finally {
        setLoading(false);
      }
    };

    loadServer();
  }, [serverId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

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

  if (!isOwner) {
    return (
      <div className="flex h-screen">
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

          {/* No Permission Message */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                Only the server owner can modify settings.
              </p>
              <Button onClick={() => navigate("/main")}>Back to Main</Button>
            </div>
          </div>
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

  const handleSaveSettings = async () => {
    if (!editedServerName.trim()) {
      toast({
        title: "Error",
        description: "Server name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update in Firestore
      if (serverId) {
        await updateDoc(doc(db, "servers", serverId), {
          name: editedServerName,
          icon: editedServerIcon || "",
        });
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
      // Removed localStorage - data saved to Firestore

      toast({
        title: "Success",
        description: "Server settings saved successfully",
      });

      navigate("/main?settingsSaved=true");
    } catch (error) {
      console.error("Error saving server settings:", error);
      toast({
        title: "Error",
        description: "Failed to save server settings",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServer = () => {
    setDeleteServerConfirmOpen(true);
  };

  const confirmDeleteServer = async () => {
    try {
      if (!serverId) return;

      // Delete from Firestore
      await deleteDoc(doc(db, "servers", serverId));

      // Update local state
      const updatedServers = servers.filter((s) => s.id !== serverId);
      setServers(updatedServers);
      // Removed localStorage - data saved to Firestore
      setDeleteServerConfirmOpen(false);
      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
      navigate("/main");
    } catch (error) {
      console.error("Error deleting server:", error);
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteCategoryConfirmOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || !serverId) return;

    try {
      // Get channels in this category
      const channelsInCategory = currentServer?.channels?.filter(
        (c) => c.categoryId === categoryToDelete
      ) || [];

      // Prevent deletion if category has channels
      if (channelsInCategory.length > 0) {
        toast({
          title: "Cannot delete category",
          description: `This category has ${channelsInCategory.length} channel(s). Delete all channels first.`,
          variant: "destructive",
        });
        setDeleteCategoryConfirmOpen(false);
        setCategoryToDelete(null);
        return;
      }

      // Remove category from Firestore
      const updatedCategories = currentServer?.categories?.filter(
        (cat) => cat.id !== categoryToDelete
      ) || [];

      await updateDoc(doc(db, "servers", serverId), {
        categories: updatedCategories,
      });

      if (currentServer) {
        setCurrentServer({
          ...currentServer,
          categories: updatedCategories,
        });
      }

      setDeleteCategoryConfirmOpen(false);
      setCategoryToDelete(null);

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
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
    // Removed localStorage - data saved to Firestore
    setDeleteConfirmOpen(false);
    setChannelToDelete(null);

    toast({
      title: "Success",
      description: "Channel deleted successfully",
    });
  };

  const handleEditCategory = (categoryId: string, currentName: string) => {
    setEditingCategoryId(categoryId);
    setEditedCategoryName(currentName);
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryId || !serverId || !editedCategoryName.trim()) return;

    try {
      const updatedCategories = currentServer?.categories?.map((cat) =>
        cat.id === editingCategoryId ? { ...cat, name: editedCategoryName.trim() } : cat
      ) || [];

      await updateDoc(doc(db, "servers", serverId), {
        categories: updatedCategories,
      });

      if (currentServer) {
        setCurrentServer({
          ...currentServer,
          categories: updatedCategories,
        });
      }

      setEditingCategoryId(null);
      setEditedCategoryName("");

      toast({
        title: "Success",
        description: "Category name updated successfully",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category name",
        variant: "destructive",
      });
    }
  };

  const handleEditChannel = (channelId: string, currentName: string) => {
    setEditingChannelId(channelId);
    setEditedChannelName(currentName);
  };

  const handleSaveChannel = async () => {
    if (!editingChannelId || !serverId || !editedChannelName.trim()) return;

    try {
      const updatedChannels = currentServer?.channels?.map((ch) =>
        ch.id === editingChannelId ? { ...ch, name: editedChannelName.trim() } : ch
      ) || [];

      await updateDoc(doc(db, "servers", serverId), {
        channels: updatedChannels,
      });

      if (currentServer) {
        setCurrentServer({
          ...currentServer,
          channels: updatedChannels,
        });
      }

      setEditingChannelId(null);
      setEditedChannelName("");

      toast({
        title: "Success",
        description: "Channel name updated successfully",
      });
    } catch (error) {
      console.error("Error updating channel:", error);
      toast({
        title: "Error",
        description: "Failed to update channel name",
        variant: "destructive",
      });
    }
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

            {/* Categories Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <div className="space-y-2">
                {currentServer.categories?.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-3 rounded bg-accent/20 justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      {editingCategoryId === category.id ? (
                        <Input
                          value={editedCategoryName}
                          onChange={(e) => setEditedCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCategory();
                            if (e.key === 'Escape') {
                              setEditingCategoryId(null);
                              setEditedCategoryName("");
                            }
                          }}
                          className="h-7 text-sm flex-1 max-w-xs"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium">{category.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                        {currentServer.channels?.filter((c) => c.categoryId === category.id).length || 0} channels
                      </span>
                      {editingCategoryId === category.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={handleSaveCategory}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditedCategoryName("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/10"
                            onClick={() => handleEditCategory(category.id, category.name)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm">{channel.type === "voice" ? "🎙" : "#"}</span>
                              {editingChannelId === channel.id ? (
                                <Input
                                  value={editedChannelName}
                                  onChange={(e) => setEditedChannelName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveChannel();
                                    if (e.key === 'Escape') {
                                      setEditingChannelId(null);
                                      setEditedChannelName("");
                                    }
                                  }}
                                  className="h-7 text-sm flex-1 max-w-xs"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-sm">{channel.name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                                {channel.type === "voice" ? "Voice" : "Text"}
                              </span>
                              {editingChannelId === channel.id ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100"
                                    onClick={handleSaveChannel}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setEditingChannelId(null);
                                      setEditedChannelName("");
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-primary/10"
                                    onClick={() => handleEditChannel(channel.id, channel.name)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteChannel(channel.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
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

      {/* Delete Server Confirmation Dialog */}
      <AlertDialog open={deleteServerConfirmOpen} onOpenChange={setDeleteServerConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editedServerName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteServer}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={deleteCategoryConfirmOpen} onOpenChange={setDeleteCategoryConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category. Make sure all channels in this category are deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
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
