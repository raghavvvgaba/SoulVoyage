import { useState, useRef } from "react";
import { Plus, Upload, X } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface ServerCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerCreate: (serverData: {
    name: string;
    icon?: string;
  }) => void;
}

export const ServerCreationDialog = ({
  open,
  onOpenChange,
  onServerCreate,
}: ServerCreationDialogProps) => {
  const [step, setStep] = useState<"initial" | "create" | "join">("initial");
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleReset = () => {
    setStep("initial");
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

  const handleCreateServer = () => {
    if (!serverName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a server name",
        variant: "destructive",
      });
      return;
    }

    onServerCreate({
      name: serverName,
      icon: serverIcon || undefined,
    });

    handleReset();
    onOpenChange(false);
    toast({
      title: "Success",
      description: `Server "${serverName}" has been created!`,
    });
  };

  const handleJoinServer = () => {
    if (!inviteLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite link",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Feature Coming Soon",
      description: "Join server functionality will be available soon",
    });

    handleReset();
    onOpenChange(false);
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
              onClick={() => setStep("create")}
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

      {step === "create" && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Server</DialogTitle>
            <DialogDescription>
              Give your new server a name and optional icon before launching.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
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
                onClick={() => setStep("initial")}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={handleCreateServer}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Create
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
