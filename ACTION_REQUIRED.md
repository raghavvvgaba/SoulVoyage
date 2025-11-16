# ⚠️ ACTION REQUIRED: Update Firestore Rules

## The Problem
Previous accounts are not showing because **Firestore security rules are blocking access** to the `deviceAccounts` collection.

## ✅ STEP 1: Update Firestore Security Rules (REQUIRED)

### Do this NOW:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your SoulVoyage project

2. **Navigate to Firestore Rules**
   - Click **Firestore Database** in left sidebar
   - Click **Rules** tab at the top

3. **Add the New Rule**
   - Find the line that says `service cloud.firestore {`
   - Before the closing `}` at the end, add this:

   ```firestore
   // Device accounts for tracking previously logged-in accounts per device
   match /deviceAccounts/{deviceId}/accounts/{userId} {
     allow read, write: if true;
   }
   ```

4. **Click "Publish"** button
   - You should see "Rules updated successfully"

### OR Copy Entire Rules File:

Open `FIRESTORE_RULES_UPDATED.md` in this project, copy ALL the rules, paste in Firebase Console, and click **Publish**.

---

## ✅ STEP 2: Test Again

After updating rules:

1. **Clear your browser console** (important!)
2. **Refresh the page** or restart dev server
3. **Login with Account A**
4. Open browser console (F12) and look for these logs:
   ```
   ✅ AuthContext - Successfully saved logged-in account
   ✅ AuthContext - Fetched X previous accounts
   ```
5. **Logout**
6. **Login with Account B**
7. Navigate to **Profile Menu → Change Profiles**
8. You should see **Account A** under "Previously Logged In"

---

## 🔍 Debug If Still Not Working

### Check Console Logs

After login, you should see:
```
🔐 AuthContext - Auth state changed
🔄 AuthContext - Saving account to device: device_xxx userId: yyy
✅ AuthContext - Successfully saved logged-in account
🔍 AuthContext - Fetching previous accounts for device: device_xxx
📄 AuthContext - Found account: [name] [email]
✅ AuthContext - Fetched X previous accounts
```

### If You See Errors:

**Error: "Missing or insufficient permissions"**
- ❌ Firestore rules NOT updated correctly
- Solution: Double-check Step 1

**Error: "index-required"**
- ❌ Firestore index missing for `lastLoginAt`
- Solution: Click the link in error message, Firebase will create index

**No errors but 0 accounts fetched**
- Check Firebase Console → Firestore Database → Data
- Look for `deviceAccounts` collection
- If empty, accounts aren't being saved (check rules again)

### Check Device ID
In browser console:
```javascript
localStorage.getItem("deviceId")
```
Should return something like: `device_1736822400000_xyz123`

### Check Firestore Data
Go to Firebase Console → Firestore Database → Data tab

You should see:
```
deviceAccounts/
  └─ device_xxx/
      └─ accounts/
          ├─ [userId1]/  (name, email, lastLoginAt)
          └─ [userId2]/  (name, email, lastLoginAt)
```

---

## 📋 Summary

**What I changed:**
1. ✅ Updated `AuthContext.tsx` to track logged-in accounts per device
2. ✅ Updated `ChangeProfiles.tsx` to display previous accounts
3. ✅ Added comprehensive logging for debugging
4. ✅ Build successful (no errors)

**What YOU need to do:**
1. ⚠️ **Update Firestore security rules** (Step 1 above)
2. ⚠️ Test with 2 accounts
3. ⚠️ Check console logs if issues persist

---

## 🆘 Still Having Issues?

Share these details:
1. Screenshot of browser console after login
2. Screenshot of Firebase Console → Firestore Rules
3. Screenshot of Firebase Console → Firestore Data → deviceAccounts
4. Device ID from localStorage: `localStorage.getItem("deviceId")`
