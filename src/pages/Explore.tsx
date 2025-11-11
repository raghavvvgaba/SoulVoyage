import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ArrowLeft, Globe, Search, Lock, Globe2, Users } from "lucide-react";
import Globe3D from "@/components/Globe3D";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Server {
  id: string;
  name: string;
  place?: string;
  description?: string;
  isPublic: boolean;
  icon?: string;
  owner?: string;
  members?: number;
}

const Explore = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch servers from Firestore
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const q = query(collection(db, "servers"));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const serversData: Server[] = [];

          for (const doc of snapshot.docs) {
            const serverData = doc.data();
            
            // Count members in the server
            const membersQuery = query(
              collection(db, `servers/${doc.id}/members`)
            );
            const membersSnapshot = await getDocs(membersQuery);
            const memberCount = membersSnapshot.size;

            serversData.push({
              id: doc.id,
              name: serverData.name,
              place: serverData.place || "Unknown Location",
              description: serverData.description || "No description",
              isPublic: serverData.isPublic || true,
              icon: serverData.icon,
              owner: serverData.owner,
              members: memberCount,
            });
          }

          // Sort by members (popular first)
          serversData.sort((a, b) => (b.members || 0) - (a.members || 0));
          setServers(serversData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching servers:", error);
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  // Filter servers based on search query
  const filteredServers = servers.filter((server) =>
    server.place?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold mb-2">Discover Servers</h2>
            <p className="text-muted-foreground mb-8">
              Explore and join amazing communities on SoulVoyage
            </p>
          </div>

          {/* 3D Globe */}
          <div className="rounded-lg border border-border overflow-hidden mb-8">
            <Globe3D />
          </div>

          {/* Search Section */}
          <div className="mt-8 mb-8">
            <div className="flex gap-2 max-w-md">
              <Input
                type="text"
                placeholder="Search servers by place or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredServers.length} server{filteredServers.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Popular Servers Section */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-6">
              {searchQuery ? "Search Results" : "Popular Servers"}
            </h3>

            {loading && servers.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Searching for servers...</p>
              </div>
            ) : filteredServers.length === 0 ? (
              <div className="text-center py-12">
                <Globe2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `No servers found for "${searchQuery}"`
                    : "No existing servers right now"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServers.map((server) => (
                  <div
                    key={server.id}
                    className="border border-border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-200"
                  >
                    {/* Server Card */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() =>
                        setExpandedServerId(
                          expandedServerId === server.id ? null : server.id
                        )
                      }
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{server.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe2 className="h-4 w-4" />
                            {server.place}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {server.isPublic ? (
                            <Globe2 className="h-5 w-5 text-primary" title="Public Server" />
                          ) : (
                            <Lock className="h-5 w-5 text-yellow-500" title="Private Server" />
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">
                        {server.description}
                      </p>

                      {/* Members Count */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{server.members || 0} members</span>
                      </div>
                    </div>

                    {/* Expanded Actions */}
                    {expandedServerId === server.id && (
                      <div className="border-t border-border px-6 py-4 bg-card/30 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {server.isPublic
                            ? "Public server - Anyone can join via invite link"
                            : "Private server - Requires owner approval to join"}
                        </p>
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Feature Coming Soon",
                              description: server.isPublic 
                                ? "Join functionality will be available soon"
                                : "Join request functionality will be available soon",
                            });
                          }}
                        >
                          {server.isPublic ? "Join This Server" : "Ask to Join"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
