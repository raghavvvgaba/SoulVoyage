import { useState, useRef } from "react";
import { Plus, Upload, X, Globe, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";

interface ServerCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerCreate: (serverData: {
    name: string;
    icon?: string;
    isPublic?: boolean;
  }) => void;
}

export const ServerCreationDialog = ({
  open,
  onOpenChange,
  onServerCreate,
}: ServerCreationDialogProps) => {
  const [step, setStep] = useState<"initial" | "privacy" | "create" | "join">("initial");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleReset = () => {
    setStep("initial");
    setIsPublic(true);
    setServerName("");
    setServerIcon(null);
    setInviteLink("");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setServerIcon(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateServer = async () => {
    if (!serverName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a server name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await onServerCreate({
        name: serverName,
        icon: serverIcon || undefined,
        isPublic: isPublic,
      });

      handleReset();
      onOpenChange(false);
      setIsCreating(false);
      toast({
        title: "Success",
        description: `Server "${serverName}" has been created!`,
      });
    } catch (error) {
      console.error("Error creating server:", error);
      setIsCreating(false);
      toast({
        title: "Error",
        description: "Failed to create server",
        variant: "destructive",
      });
    }
  };

  const handleJoinServer = async () => {
    if (!inviteLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite link",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Extract invite code from URL
      const inviteCode = inviteLink.split("/invite/").pop()?.split("?")[0];
      
      if (!inviteCode) {
        toast({
          title: "Error",
          description: "Invalid invite link format",
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      console.log("Looking for server with invite code:", inviteCode);

      // Find server by invite code
      const serversQuery = query(
        collection(db, "servers"),
        where("inviteCode", "==", inviteCode)
      );
      
      const snapshot = await getDocs(serversQuery);
      
      if (snapshot.empty) {
        toast({
          title: "Error",
          description: "Invalid invite link. Server not found.",
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      const serverDoc = snapshot.docs[0];
      const serverId = serverDoc.id;
      const serverData = serverDoc.data();

      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to join a server",
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      // Check if user is already a member
      const memberQuery = query(
        collection(db, "servers", serverId, "members"),
        where("userId", "==", currentUser.uid)
      );
      const memberSnapshot = await getDocs(memberQuery);

      if (!memberSnapshot.empty) {
        toast({
          title: "Already a member",
          description: `You're already a member of ${serverData.name}`,
        });
        setIsCreating(false);
        handleReset();
        onOpenChange(false);
        return;
      }

      // Add user to server members
      await setDoc(doc(db, "servers", serverId, "members", currentUser.uid), {
        userId: currentUser.uid,
        joinedAt: new Date(),
        role: "member",
      });

      toast({
        title: "Success!",
        description: `You've joined ${serverData.name}`,
      });

      handleReset();
      onOpenChange(false);
      setIsCreating(false);
    } catch (error) {
      console.error("Error joining server:", error);
      setIsCreating(false);
      toast({
        title: "Error",
        description: "Failed to join server. Please try again.",
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
    <Dialog open={open} onOpenChange={handleClose}>
      {step === "initial" && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Your Server</DialogTitle>
            <DialogDescription>
              Start your own server to bring your community together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => setStep("privacy")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
            >
              Create My Own
            </Button>
            <Button
              onClick={() => setStep("join")}
              variant="outline"
              className="w-full font-semibold h-11"
            >
              Join a Server
            </Button>
          </div>
        </DialogContent>
      )}

      {step === "privacy" && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Server Type</DialogTitle>
            <DialogDescription>
              Select whether your server should be public or private
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup 
              value={isPublic ? "public" : "private"} 
              onValueChange={(value) => setIsPublic(value === "public")}
            >
              <div className="space-y-3">
                <Label
                  htmlFor="public"
                  className="flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer hover:bg-accent transition-colors"
                  style={{
                    borderColor: isPublic ? "hsl(var(--primary))" : "hsl(var(--border))",
                    backgroundColor: isPublic ? "hsl(var(--primary) / 0.05)" : "transparent",
                  }}
                >
                  <RadioGroupItem value="public" id="public" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Public Server</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Anyone can discover and join this server. Visible to all users.
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="private"
                  className="flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer hover:bg-accent transition-colors"
                  style={{
                    borderColor: !isPublic ? "hsl(var(--primary))" : "hsl(var(--border))",
                    backgroundColor: !isPublic ? "hsl(var(--primary) / 0.05)" : "transparent",
                  }}
                >
                  <RadioGroupItem value="private" id="private" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Private Server</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invite-only. Only members you invite can see and join this server.
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("initial")}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button onClick={() => setStep("create")} className="flex-1">
                Next: Server Details
              </Button>
            </div>
          </div>
        </DialogContent>
      )}

      {step === "create" && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Server</DialogTitle>
            <DialogDescription>
              Give your {isPublic ? "public" : "private"} server a name and icon
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Server Type Badge */}
            <div className="flex items-center justify-center gap-2 text-sm bg-muted/50 p-2 rounded">
              {isPublic ? (
                <>
                  <Globe className="h-4 w-4" />
                  <span>Public Server</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Private Server</span>
                </>
              )}
            </div>

            {/* Icon Upload Section */}
            <div className="flex justify-center">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed hover:border-primary transition-colors"
                >
                  {serverIcon ? (
                    <Avatar className="w-full h-full">
                      <AvatarImage src={serverIcon} />
                    </Avatar>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5" />
                      <span className="text-xs">Upload</span>
                    </div>
                  )}
                </Button>
                {serverIcon && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    onClick={() => setServerIcon(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Icon Preview or Initials */}
            <div className="flex justify-center">
              {serverName && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <Avatar className="w-16 h-16 mx-auto">
                    <AvatarImage src={serverIcon || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {getInitials(serverName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            {/* Server Name Input */}
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name *</Label>
              <Input
                id="server-name"
                placeholder="Enter server name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateServer();
                  }
                }}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {serverName.length}/100
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("privacy")}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={handleCreateServer}
                disabled={isCreating || !serverName.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      )}

      {step === "join" && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Server</DialogTitle>
            <DialogDescription>
              Enter an invite link to join an existing server.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-link">Invite Link</Label>
              <Input
                id="invite-link"
                placeholder="https://discord.gg/invite-code"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleJoinServer();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the exact invite link provided by the server owner
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("initial")}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={handleJoinServer}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Join Server
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
