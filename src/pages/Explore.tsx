import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ArrowLeft, Globe } from "lucide-react";
import Globe3D from "@/components/Globe3D";

const Explore = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/main")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Explore Servers</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold mb-2">Discover Servers</h2>
            <p className="text-muted-foreground mb-8">
              Explore and join amazing communities on SoulVoyage
            </p>
          </div>

          {/* 3D Globe */}
          <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden mb-8">
            <Globe3D />
          </div>

          {/* Server listing section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Popular Servers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* This is a placeholder - implement server discovery features here */}
              <div className="border border-border rounded-lg p-6 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors cursor-pointer">
                <h4 className="font-semibold mb-2">Server Discovery Coming Soon</h4>
                <p className="text-sm text-muted-foreground">
                  Browse and discover new servers to join. More features coming soon!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
