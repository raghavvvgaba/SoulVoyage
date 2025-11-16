# Debug: Previous Accounts Not Showing

## Steps to Debug

### 1. Check Browser Console
Open your browser console (F12 or Right-click → Inspect → Console) and look for these logs when you log in:

**Expected logs when logging in:**
```
🔐 AuthContext - Auth state changed: {...}
AuthContext - Fetching profile for userId: xxx
🔄 AuthContext - Saving account to device: device_xxx userId: yyy
📝 AuthContext - Account data to save: {userId, name, email, ...}
✅ AuthContext - Successfully saved logged-in account
🔍 AuthContext - Fetching previous accounts for device: device_xxx
📄 AuthContext - Found account: [name] [email] [userId]
✅ AuthContext - Fetched X previous accounts
```

**If you see errors:**
- ❌ Error: "Missing or insufficient permissions" → Firestore rules not updated
- ❌ Error fetching/saving → Check network tab for details

### 2. Verify Firestore Rules Are Updated

**CRITICAL**: You MUST update Firestore security rules first!

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Check if you see this rule:
   ```
   match /deviceAccounts/{deviceId}/accounts/{userId} {
     allow read, write: if true;
   }
   ```
5. If NOT present, copy rules from `FIRESTORE_RULES_UPDATED.md` and click **Publish**

### 3. Check localStorage for Device ID

In browser console, run:
```javascript
localStorage.getItem("deviceId")
```

You should see something like: `device_1234567890_abc123`

If null, it will be created automatically on next login.

### 4. Check Firestore Database

Go to Firebase Console → Firestore Database → Data tab

Look for:
```
deviceAccounts/
  device_xxx/
    accounts/
      [userId1]/
      [userId2]/
```

If this collection doesn't exist, accounts are not being saved (likely a rules issue).

### 5. Test Scenario

**Scenario to test:**
1. Clear browser cache (optional: to start fresh)
2. Sign up/login with Account A
3. Check console for logs (should see "Saved logged-in account")
4. Logout
5. Sign up/login with Account B
6. Check console for logs (should see "Fetched 2 previous accounts")
7. Go to "Change Profiles"
8. You should see Account A in "Previously Logged In"

### 6. Manual Firestore Test

Run this in browser console when logged in:

```javascript
// Get current device ID
const deviceId = localStorage.getItem("deviceId");
console.log("Device ID:", deviceId);

// Check if Firebase is accessible
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Try to fetch accounts
const accountsRef = collection(db, "deviceAccounts", deviceId, "accounts");
getDocs(accountsRef)
  .then(snapshot => {
    console.log("Found accounts:", snapshot.size);
    snapshot.forEach(doc => console.log(doc.data()));
  })
  .catch(err => console.error("Error:", err));
```

## Common Issues

### Issue 1: Firestore Rules Not Updated ❌
**Symptom**: Console shows "Missing or insufficient permissions"
**Solution**: Update Firestore rules from `FIRESTORE_RULES_UPDATED.md`

### Issue 2: Accounts Saved But Not Fetched ❌
**Symptom**: "Saved logged-in account" but "Fetched 0 previous accounts"
**Solution**: 
- Check if `orderBy("lastLoginAt")` index exists in Firestore
- Go to Firebase Console → Firestore → Indexes
- May need to create composite index (Firebase will prompt if needed)

### Issue 3: Device ID Changes ❌
**Symptom**: Different device ID each time
**Solution**: 
- Check if localStorage is being cleared
- Check browser privacy settings (incognito mode clears localStorage on close)

### Issue 4: Timing Issue ❌
**Symptom**: Accounts appear after page refresh
**Solution**: Already implemented - `fetchPreviousAccounts()` is called after saving

## Quick Fix Commands

### Clear everything and start fresh:
```javascript
// In browser console
localStorage.clear();
location.reload();
```

Then sign up with 2 different accounts to test.

## What Should Happen

1. **First Login (Account A)**:
   - Device ID created
   - Account A saved to Firestore
   - Change Profiles shows: Account A (current)

2. **Logout and Login (Account B)**:
   - Same device ID used
   - Account B saved to Firestore
   - Change Profiles shows: 
     - Account B (current)
     - Account A (previously logged in)

3. **Click Account A**:
   - Logs out Account B
   - Redirects to /login-auth
   - You sign in with Account A credentials
   - Account A becomes current
   - Change Profiles shows:
     - Account A (current)
     - Account B (previously logged in)

---

## Need More Help?

Check these logs in console and report back:
1. Is device ID consistent? (run `localStorage.getItem("deviceId")`)
2. Any error messages in console?
3. Check Network tab → Filter by "firestore" → Any 403 errors?
4. Screenshot of Firestore Database → deviceAccounts collection
