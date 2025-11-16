import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, limit } from "firebase/firestore";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  userId: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
}

interface AuthContextType {
  user: User | null;
  currentProfile: UserProfile | null;
  previousAccounts: UserProfile[];
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchAccount: (userId: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate a device ID for tracking logged-in accounts per device
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [previousAccounts, setPreviousAccounts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("AuthContext - Fetching profile for userId:", userId);
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("AuthContext - User document data:", data);
        const profile: UserProfile = {
          id: userDoc.id,
          name: data.name || "",
          email: data.email || "",
          userId: data.userId || userDoc.id,
          avatarUrl: data.avatarUrl,
          lastLoginAt: new Date(),
        };
        console.log("AuthContext - Setting currentProfile:", profile);
        setCurrentProfile(profile);
        
        // Save to device's logged-in accounts
        await saveLoggedInAccount(profile);
      } else {
        console.log("AuthContext - User document does not exist for:", userId);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const saveLoggedInAccount = async (profile: UserProfile) => {
    try {
      const deviceId = getDeviceId();
      console.log("🔄 AuthContext - Saving account to device:", deviceId, "userId:", profile.userId);
      const accountRef = doc(db, "deviceAccounts", deviceId, "accounts", profile.userId);
      
      const accountData = {
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl || "",
        lastLoginAt: new Date(),
      };
      
      console.log("📝 AuthContext - Account data to save:", accountData);
      await setDoc(accountRef, accountData, { merge: true });
      console.log("✅ AuthContext - Successfully saved logged-in account");
      
      // Refresh previous accounts list
      await fetchPreviousAccounts();
    } catch (error) {
      console.error("❌ AuthContext - Error saving logged-in account:", error);
      console.error("Error details:", error);
    }
  };

  const fetchPreviousAccounts = async () => {
    try {
      const deviceId = getDeviceId();
      console.log("🔍 AuthContext - Fetching previous accounts for device:", deviceId);
      const accountsRef = collection(db, "deviceAccounts", deviceId, "accounts");
      const q = query(accountsRef, orderBy("lastLoginAt", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      
      const accounts: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📄 AuthContext - Found account:", data.name, data.email, data.userId);
        accounts.push({
          id: doc.id,
          userId: data.userId,
          name: data.name || "",
          email: data.email || "",
          avatarUrl: data.avatarUrl,
          lastLoginAt: data.lastLoginAt?.toDate(),
        });
      });
      
      console.log("✅ AuthContext - Fetched", accounts.length, "previous accounts");
      console.log("Previous accounts:", accounts);
      setPreviousAccounts(accounts);
    } catch (error) {
      console.error("❌ AuthContext - Error fetching previous accounts:", error);
      console.error("Error details:", error);
    }
  };

  useEffect(() => {
    console.log("🔐 AuthContext - Setting up auth listener");
    
    // Fetch previous accounts on mount
    fetchPreviousAccounts();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔐 AuthContext - Auth state changed:", {
        uid: currentUser?.uid || "null",
        email: currentUser?.email || "null",
        timestamp: new Date().toISOString(),
      });
      
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        console.log("⚠️ AuthContext - User is NULL - logged out or not authenticated");
        setCurrentProfile(null);
      }
      setLoading(false);
    });

    return () => {
      console.log("🔐 AuthContext - Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  const logout = async () => {
    console.log("🚪 AuthContext - LOGOUT CALLED");
    console.trace("Logout call stack:");
    
    try {
      await signOut(auth);
      setUser(null);
      setCurrentProfile(null);
      console.log("✅ AuthContext - Logout successful");
    } catch (error) {
      console.error("❌ AuthContext - Logout error:", error);
    }
  };

  const switchAccount = async (userId: string, email: string) => {
    console.log("🔄 AuthContext - Switching to account:", userId, email);
    // Store the email we're switching to
    localStorage.setItem("switchingToEmail", email);
    // Logout current user
    await logout();
  };

  const value: AuthContextType = {
    user,
    currentProfile,
    previousAccounts,
    loading,
    logout,
    refreshProfile,
    switchAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
