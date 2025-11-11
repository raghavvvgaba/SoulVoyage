import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

export const MigrateData = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "migrating" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<string[]>([]);
  const [authUid, setAuthUid] = useState("");
  const [customId, setCustomId] = useState("");

  useEffect(() => {
    // Get IDs on mount
    const user = auth.currentUser;
    if (user) {
      setAuthUid(user.uid);
    }
    
    // Try to find old profile in Firestore by querying all users
    // No longer using localStorage
  }, []);

  const addDetail = (detail: string) => {
    console.log(detail);
    setDetails(prev => [...prev, detail]);
  };

  const migrateUserData = async () => {
    const user = auth.currentUser;
    if (!user) {
      setStatus("error");
      setMessage("No user logged in. Please log in first.");
      return;
    }

    const authUid = user.uid;
    
    // Search for old profile by looking for documents where userId != document ID
    addDetail(`🔍 Searching for old profile data...`);
    
    try {
      const usersRef = collection(db, "users");
      const allUsers = await getDocs(usersRef);
      let customId = "";
      
      for (const userDoc of allUsers.docs) {
        const data = userDoc.data();
        // If document ID doesn't match auth UID and email matches, it's old data
        if (userDoc.id !== authUid && data.email === user.email) {
          customId = userDoc.id;
          addDetail(`✅ Found old profile at: ${customId}`);
          break;
        }
      }
      
      if (!customId) {
        setStatus("success");
        setMessage("No old data found. Your profile is already in the correct location!");
        return;
      }
    } catch (error) {
      setStatus("error");
      setMessage("Error searching for old data: " + error.message);
      return;
    }
    
    const customId = ""; // Will be set in try block above

    if (authUid === customId) {
      setStatus("success");
      setMessage("Data already in correct location. No migration needed!");
      return;
    }

    setStatus("migrating");
    setMessage("Starting migration...");
    setDetails([]);

    try {
      addDetail(`🔍 Checking old profile at: users/${customId}`);
      
      // Get old profile
      const oldProfileDoc = await getDoc(doc(db, "users", customId));
      
      if (!oldProfileDoc.exists()) {
        setStatus("error");
        setMessage("Old profile not found. You might already be migrated or need to sign up.");
        addDetail("❌ Old profile document doesn't exist");
        return;
      }

      const oldData = oldProfileDoc.data();
      addDetail(`✅ Found old profile: ${oldData.name}`);

      // Check if new profile already exists
      const newProfileDoc = await getDoc(doc(db, "users", authUid));
      if (newProfileDoc.exists()) {
        addDetail(`⚠️  Profile already exists at new location`);
      }

      // Create new profile with correct structure
      const newProfile = {
        ...oldData,
        id: authUid, // Update to auth UID
        createdAt: oldData.createdAt || new Date(),
      };

      addDetail(`📝 Saving profile to: users/${authUid}`);
      await setDoc(doc(db, "users", authUid), newProfile);
      addDetail("✅ Profile saved successfully");

      // Migrate friends sub-collection
      addDetail(`🔍 Looking for friends at: users/${customId}/friends`);
      const oldFriendsRef = collection(db, "users", customId, "friends");
      const friendsSnapshot = await getDocs(oldFriendsRef);
      
      addDetail(`📋 Found ${friendsSnapshot.size} friend(s) to migrate`);
      
      if (friendsSnapshot.size > 0) {
        let friendCount = 0;
        for (const friendDoc of friendsSnapshot.docs) {
          await setDoc(
            doc(db, "users", authUid, "friends", friendDoc.id),
            friendDoc.data()
          );
          friendCount++;
          addDetail(`✅ Migrated friend ${friendCount}/${friendsSnapshot.size}: ${friendDoc.data().name}`);
        }
        addDetail(`✅ All friends migrated successfully`);
      } else {
        addDetail("ℹ️  No friends to migrate");
      }

      // Update friend requests that reference the old ID
      addDetail(`🔍 Updating friend requests...`);
      try {
        const friendRequestsRef = collection(db, "friendRequests");
        
        // Update requests FROM this user
        const sentRequestsQuery = query(friendRequestsRef, where("fromUserId", "==", customId));
        const sentRequests = await getDocs(sentRequestsQuery);
        for (const reqDoc of sentRequests.docs) {
          await setDoc(doc(db, "friendRequests", reqDoc.id), {
            ...reqDoc.data(),
            fromUserId: authUid,
          });
        }
        addDetail(`✅ Updated ${sentRequests.size} sent friend request(s)`);

        // Update requests TO this user
        const receivedRequestsQuery = query(friendRequestsRef, where("toUserId", "==", customId));
        const receivedRequests = await getDocs(receivedRequestsQuery);
        for (const reqDoc of receivedRequests.docs) {
          await setDoc(doc(db, "friendRequests", reqDoc.id), {
            ...reqDoc.data(),
            toUserId: authUid,
          });
        }
        addDetail(`✅ Updated ${receivedRequests.size} received friend request(s)`);
      } catch (error) {
        addDetail(`⚠️  Could not update friend requests: ${error.message}`);
      }

      // Migration complete - no localStorage needed
      addDetail(`✅ Migration complete - all data in Firestore`);

      setStatus("success");
      setMessage("Migration completed successfully! Redirecting to main page...");
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/main");
        window.location.reload(); // Force reload to refresh all data
      }, 3000);

    } catch (error) {
      console.error("Migration error:", error);
      setStatus("error");
      setMessage(`Migration failed: ${error.message}`);
      addDetail(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Data Migration</CardTitle>
          <CardDescription>
            Migrate your user data to the new storage location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ID Information */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Old Location (Custom ID):</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                {customId || "Not found"}
              </code>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">New Location (Firebase Auth UID):</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                {authUid || "Not logged in"}
              </code>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <Alert className={
              status === "success" ? "border-green-500 bg-green-50 dark:bg-green-950" :
              status === "error" ? "border-red-500 bg-red-50 dark:bg-red-950" :
              "border-blue-500 bg-blue-50 dark:bg-blue-950"
            }>
              <div className="flex items-start gap-2">
                {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
                {status === "migrating" && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                <AlertDescription className="flex-1">{message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Migration Details */}
          {details.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Migration Progress:</h3>
              <div className="max-h-64 overflow-y-auto space-y-1 p-4 bg-muted/30 rounded-lg">
                {details.map((detail, index) => (
                  <div key={index} className="text-sm font-mono">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={migrateUserData}
              disabled={status === "migrating" || status === "success" || !authUid || !customId}
              className="flex-1"
            >
              {status === "migrating" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === "migrating" ? "Migrating..." : "Start Migration"}
            </Button>
            <Button
              onClick={() => navigate("/main")}
              variant="outline"
              disabled={status === "migrating"}
            >
              Skip / Go Back
            </Button>
          </div>

          {/* Warning */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Note:</strong> This migration will copy your profile and friends to the new location.
              Your old data will remain unchanged. After successful migration, the app will automatically
              use the new location.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrateData;
