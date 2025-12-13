# ⚠️ MIGRATION REQUIRED - User Data Location Changed

## What Changed?

Previously, user profiles were saved in Firestore under a **custom generated ID**:
```
/users/{custom-id-1234567-ABC}/
```

Now, user profiles are saved under the **Firebase Auth UID**:
```
/users/{firebase-auth-uid}/
```

This ensures consistency across the app and proper data synchronization.

## Impact

### For Existing Users:
- ❌ Profile won't load (looking in wrong location)
- ❌ Friends won't show (friends stored under auth UID, but profile under custom ID)
- ❌ Profile initials won't display

### For New Users:
- ✅ Everything works perfectly
- ✅ Profile loads correctly
- ✅ Friends display properly
- ✅ All data in the right place

---

## Solutions

### Option 1: Sign Up with New Account (Recommended for Testing)

**Quickest solution:**
1. Logout from current account
2. Sign up with a new email
3. Everything will work perfectly

**Pros:**
- Clean start with correct structure
- No data migration needed
- Immediate testing

**Cons:**
- Lose existing data (friends, servers, messages)

---

### Option 2: Migrate Existing User Data

**For keeping your current data:**

#### Step 1: Find Your IDs

Open browser console and run:
```javascript
// Find Firebase Auth UID
console.log("Auth UID:", firebase.auth().currentUser.uid);

// Find custom User ID (in localStorage or Firestore)
const customId = localStorage.getItem("currentProfileId");
console.log("Custom ID:", customId);
```

#### Step 2: Use Firebase Console

Go to: Firebase Console → Firestore Database

**Manual Migration:**
1. Find your user document under old ID (e.g., `users/1730881234-ABC123`)
2. Copy all data from that document
3. Create new document at `users/{your-firebase-auth-uid}`
4. Paste the data
5. Update the `id` field to match Firebase Auth UID
6. Copy the `friends` sub-collection to the new location

**OR**

#### Step 3: Run Migration Script (Automated)

Create a temporary migration page:

```typescript
// src/pages/MigrateData.tsx
import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export const MigrateData = () => {
  useEffect(() => {
    const migrateUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        return;
      }

      const authUid = user.uid;
      const customId = localStorage.getItem("currentProfileId");
      
      if (!customId) {
        console.log("No custom ID found");
        return;
      }

      console.log("Migrating from:", customId, "to:", authUid);

      try {
        // Get old profile
        const oldProfileDoc = await getDoc(doc(db, "users", customId));
        
        if (!oldProfileDoc.exists()) {
          console.log("Old profile not found");
          return;
        }

        const oldData = oldProfileDoc.data();
        console.log("Old profile data:", oldData);

        // Create new profile with correct structure
        const newProfile = {
          ...oldData,
          id: authUid, // Update to auth UID
        };

        // Save to new location
        await setDoc(doc(db, "users", authUid), newProfile);
        console.log("Profile migrated successfully");

        // Migrate friends sub-collection
        const oldFriendsRef = collection(db, "users", customId, "friends");
        const friendsSnapshot = await getDocs(oldFriendsRef);
        
        console.log("Migrating", friendsSnapshot.size, "friends");
        
        for (const friendDoc of friendsSnapshot.docs) {
          await setDoc(
            doc(db, "users", authUid, "friends", friendDoc.id),
            friendDoc.data()
          );
        }

        console.log("Migration complete! Refresh the page.");
        alert("Migration complete! Refresh the page.");
      } catch (error) {
        console.error("Migration error:", error);
        alert("Migration failed: " + error.message);
      }
    };

    migrateUserData();
  }, []);

  return (
    <div className="p-8">
      <h1>Migrating data...</h1>
      <p>Check console for progress</p>
    </div>
  );
};
```

Add route in App.tsx:
```typescript
{ path: "/migrate", element: <MigrateData /> }
```

Then visit: `http://localhost:8080/migrate`

---

## What I Fixed

### 1. **AuthContext.tsx** ✅
- Now fetches profile using Firebase Auth UID
- Logs to console for debugging

### 2. **SignupAuth.tsx** ✅
- **NEW SIGNUPS:** Now save profile under Firebase Auth UID
- Keeps custom userId for display (friend requests, etc.)

### 3. **Friends.tsx** ✅
- Loads friends from Firebase Auth UID location
- Uses `authUserId` instead of custom ID

### 4. **ProfileMenu.tsx** ✅
- Displays initials from `currentProfile` (loaded from Firestore)
- Already using AuthContext

---

## Verification Steps

After migration or new signup:

1. **Check Console Logs:**
   - "AuthContext - Fetching profile for userId: {firebase-uid}"
   - "AuthContext - User document data: {name, email, ...}"
   - "AuthContext - Setting currentProfile: {profile data}"
   - "ProfileMenu - currentProfile: {should show data}"
   - "Loading friends for user: {firebase-uid}"
   - "Friends snapshot received: X friends"

2. **Check Profile Icon:**
   - Should show your initials (e.g., "JD" for John Doe)
   - Not the User icon

3. **Check Friends Page:**
   - Should list your friends
   - Not empty

4. **Check Firestore:**
   - User document at: `/users/{firebase-auth-uid}`
   - Friends at: `/users/{firebase-auth-uid}/friends/{friendId}`

---

## Recommended Action

**For immediate testing:**
1. Logout
2. Sign up with a new test email
3. Test all features
4. Everything will work correctly

**For production/real users:**
- Implement the migration script
- Run once per user
- Delete old user documents after migration

---

## Console Debugging

Open browser console and check for these logs:
- AuthContext logs showing profile fetching
- ProfileMenu logs showing currentProfile
- Friends logs showing data loading

If you see:
- "User document does not exist" → Profile not at expected location
- currentProfile: null → Auth loading or profile doesn't exist
- Friends snapshot: 0 friends → Friends not at expected location

---

**Next Step:** Choose Option 1 (new account) or Option 2 (migration) and let me know if you need help!
