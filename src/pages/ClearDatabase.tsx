import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export const ClearDatabase = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "deleting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState("");

  const addDetail = (detail: string) => {
    console.log(detail);
    setDetails(prev => [...prev, detail]);
  };

  const deleteAllData = async () => {
    if (confirmText !== "DELETE EVERYTHING") {
      setStatus("error");
      setMessage("Please type 'DELETE EVERYTHING' to confirm");
      return;
    }

    setStatus("deleting");
    setMessage("Starting database cleanup...");
    setDetails([]);

    try {
      // 1. Delete all conversations and their messages
      addDetail("🗑️  Deleting conversations...");
      const conversationsRef = collection(db, "conversations");
      const conversationsSnapshot = await getDocs(conversationsRef);
      
      for (const convDoc of conversationsSnapshot.docs) {
        addDetail(`  Deleting conversation: ${convDoc.id}`);
        
        // Delete all messages in this conversation
        const messagesRef = collection(db, "conversations", convDoc.id, "messages");
        const messagesSnapshot = await getDocs(messagesRef);
        
        for (const msgDoc of messagesSnapshot.docs) {
          await deleteDoc(msgDoc.ref);
        }
        addDetail(`    Deleted ${messagesSnapshot.size} messages`);
        
        // Delete the conversation itself
        await deleteDoc(convDoc.ref);
      }
      addDetail(`✅ Deleted ${conversationsSnapshot.size} conversations`);

      // 2. Delete all servers and their members
      addDetail("🗑️  Deleting servers...");
      const serversRef = collection(db, "servers");
      const serversSnapshot = await getDocs(serversRef);
      
      for (const serverDoc of serversSnapshot.docs) {
        addDetail(`  Deleting server: ${serverDoc.data().name}`);
        
        // Delete all members in this server
        const membersRef = collection(db, "servers", serverDoc.id, "members");
        const membersSnapshot = await getDocs(membersRef);
        
        for (const memberDoc of membersSnapshot.docs) {
          await deleteDoc(memberDoc.ref);
        }
        addDetail(`    Deleted ${membersSnapshot.size} members`);
        
        // Delete the server itself
        await deleteDoc(serverDoc.ref);
      }
      addDetail(`✅ Deleted ${serversSnapshot.size} servers`);

      // 3. Delete all friend requests
      addDetail("🗑️  Deleting friend requests...");
      const friendRequestsRef = collection(db, "friendRequests");
      const friendRequestsSnapshot = await getDocs(friendRequestsRef);
      
      for (const reqDoc of friendRequestsSnapshot.docs) {
        await deleteDoc(reqDoc.ref);
      }
      addDetail(`✅ Deleted ${friendRequestsSnapshot.size} friend requests`);

      // 4. Delete all users and their friends
      addDetail("🗑️  Deleting users...");
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      for (const userDoc of usersSnapshot.docs) {
        addDetail(`  Deleting user: ${userDoc.data().name || userDoc.id}`);
        
        // Delete all friends for this user
        const friendsRef = collection(db, "users", userDoc.id, "friends");
        const friendsSnapshot = await getDocs(friendsRef);
        
        for (const friendDoc of friendsSnapshot.docs) {
          await deleteDoc(friendDoc.ref);
        }
        addDetail(`    Deleted ${friendsSnapshot.size} friends`);
        
        // Delete the user itself
        await deleteDoc(userDoc.ref);
      }
      addDetail(`✅ Deleted ${usersSnapshot.size} users`);

      // Success!
      setStatus("success");
      setMessage("🎉 All data deleted successfully! Database is now empty.");
      addDetail("");
      addDetail("✅ Database cleanup complete!");
      addDetail("You can now sign up with a fresh account.");

    } catch (error) {
      console.error("Error deleting data:", error);
      setStatus("error");
      setMessage(`Error: ${error.message}`);
      addDetail(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-2xl text-red-600">Clear All Database Data</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            ⚠️ WARNING: This will permanently delete ALL data from Firestore!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>This action cannot be undone!</strong>
              <br />
              This will delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All user profiles</li>
                <li>All friends and friend requests</li>
                <li>All servers and channels</li>
                <li>All conversations and messages</li>
                <li>All polls and reactions</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Status Message */}
          {message && (
            <Alert className={
              status === "success" ? "border-green-500 bg-green-50 dark:bg-green-950" :
              status === "error" ? "border-red-500 bg-red-50 dark:bg-red-950" :
              "border-blue-500 bg-blue-50 dark:bg-blue-950"
            }>
              <div className="flex items-start gap-2">
                {status === "success" && <Trash2 className="h-5 w-5 text-green-600" />}
                {status === "error" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                {status === "deleting" && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                <AlertDescription className="flex-1">{message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Progress Details */}
          {details.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Progress:</h3>
              <div className="max-h-64 overflow-y-auto space-y-1 p-4 bg-muted/30 rounded-lg">
                {details.map((detail, index) => (
                  <div key={index} className="text-sm font-mono">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          {status === "idle" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-600">
                  Type "DELETE EVERYTHING" to confirm:
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE EVERYTHING"
                  className="border-red-300 focus:border-red-500"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={deleteAllData}
                  disabled={confirmText !== "DELETE EVERYTHING"}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Data
                </Button>
                <Button
                  onClick={() => navigate("/main")}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* After Deletion Actions */}
          {status === "success" && (
            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Go to Sign Up
              </Button>
              <Button
                onClick={() => navigate("/main")}
                variant="outline"
                className="flex-1"
              >
                Back to App
              </Button>
            </div>
          )}

          {/* After Error */}
          {status === "error" && (
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                  setDetails([]);
                  setConfirmText("");
                }}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate("/main")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClearDatabase;
