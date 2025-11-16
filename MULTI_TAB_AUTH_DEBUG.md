# 🔍 Multi-Tab Login Issue - Debug Guide

## Issue
When you login in one tab, your other tab gets logged out.

---

## Expected Behavior

**Firebase Auth** should persist across tabs by default:
- Login in Tab A → Both tabs authenticated ✅
- Login in Tab B → Both tabs authenticated ✅
- Logout in Tab A → Both tabs logged out ✅

Firebase uses `browserLocalPersistence` which syncs auth state across tabs automatically.

---

## Possible Causes

### 1. **Multiple Firebase App Instances**
**Problem**: Creating multiple Firebase app instances can cause conflicts
**Check**: Make sure `initializeApp()` is only called once

**Current code** (`src/lib/firebase.ts`):
```typescript
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```
✅ This is correct - single instance exported

---

### 2. **Auth State Change Listener Issues**
**Problem**: Multiple listeners might conflict or cause race conditions
**Check**: Each tab has its own `onAuthStateChanged` listener

**Current code** (`src/context/AuthContext.tsx`):
```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    } else {
      setCurrentProfile(null);
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);
```
✅ This looks correct - properly cleaned up

---

### 3. **Session Persistence Mode**
**Problem**: Wrong persistence mode set
**Default**: `browserLocalPersistence` (persists across tabs)
**Other modes**: 
- `browserSessionPersistence` (only current tab)
- `inMemoryPersistence` (lost on refresh)

**Check**: No explicit `setPersistence()` call found
✅ Using default `browserLocalPersistence`

---

### 4. **Protected Route Redirects**
**Problem**: Navigation logic logging users out
**Check**: See if routes redirect to login when auth state changes

---

### 5. **Custom Logout Logic**
**Problem**: Something triggering logout when not expected
**Check**: Only `logout()` function calls `signOut()`

---

## Debug Steps

### Step 1: Check Browser Console (Both Tabs)

**Tab 1** (already logged in):
```
Open console
Look for:
- "AuthContext - User document data: {...}"
- Any "signOut" or "logout" logs
- Any navigation redirects
```

**Tab 2** (login here):
```
Open console
Login
Look for:
- "Signed in successfully"
- Auth state change logs
```

**Tab 1** (after Tab 2 login):
```
Look for:
- Any "signOut" logs (shouldn't happen)
- "AuthContext - Fetching profile for userId: null" (indicates logout)
- Any redirect logs
```

---

### Step 2: Check Firebase Console

**Authentication → Users**:
```
Check if user is still authenticated
Check "Last sign-in" timestamp
```

If user shows as authenticated but app thinks they're logged out, it's a state management issue.

---

### Step 3: Check Network Tab

**Tab 1** (when Tab 2 logs in):
```
Open DevTools → Network tab
Filter: "auth" or "token"
Look for:
- Token refresh requests
- Any 401 errors
- Sign out requests
```

---

### Step 4: Test Auth Persistence

**Manual Test**:
```javascript
// Run in Tab 1 console
firebase.auth().onAuthStateChanged((user) => {
  console.log("Tab 1 - Auth state changed:", user?.uid || "null");
});

// Login in Tab 2
// Watch Tab 1 console - it should also see the user
```

---

## Potential Fixes

### Fix 1: Add Explicit Persistence

Add to `src/lib/firebase.ts`:
```typescript
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Ensure local persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

export const db = getFirestore(app);
```

---

### Fix 2: Add Auth State Sync Logging

Add to `src/context/AuthContext.tsx`:
```typescript
useEffect(() => {
  console.log("🔐 Setting up auth listener - Tab:", document.visibilityState);
  
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    console.log("🔐 Auth state changed:", {
      uid: currentUser?.uid || "null",
      email: currentUser?.email || "null",
      tab: document.visibilityState,
    });
    
    setUser(currentUser);
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    } else {
      console.log("⚠️ User is NULL - logged out?");
      setCurrentProfile(null);
    }
    setLoading(false);
  });

  return () => {
    console.log("🔐 Cleaning up auth listener");
    unsubscribe();
  };
}, []);
```

---

### Fix 3: Check for Logout Calls

Add logging to logout function:
```typescript
const logout = async () => {
  console.log("🚪 LOGOUT CALLED - Stack trace:");
  console.trace();
  
  try {
    await signOut(auth);
    setUser(null);
    setCurrentProfile(null);
  } catch (error) {
    console.error("Logout error:", error);
  }
};
```

---

## Common Scenarios

### Scenario 1: Browser Extension Conflict
**Symptom**: Auth state randomly clears
**Cause**: Extensions clearing cookies/storage
**Fix**: Test in incognito mode without extensions

---

### Scenario 2: IndexedDB Issues
**Symptom**: Auth state doesn't persist
**Cause**: Browser storage issues
**Fix**: Clear browser data and retry

---

### Scenario 3: Firebase Quota Exceeded
**Symptom**: Auth fails silently
**Cause**: Too many operations
**Fix**: Check Firebase Console → Usage

---

### Scenario 4: CORS or Network Issues
**Symptom**: Token refresh fails
**Cause**: Network blocking token refresh
**Fix**: Check network tab for errors

---

## Testing Checklist

- [ ] Login in Tab A
- [ ] Open Tab B (same site)
- [ ] Tab B should show logged in ✅
- [ ] Login different user in Tab B
- [ ] Tab A should update to new user ✅
- [ ] Logout in Tab A
- [ ] Tab B should also logout ✅

---

## What to Send Me

If issue persists, provide:

1. **Console logs from both tabs** (entire session)
2. **Network tab** showing any auth-related requests
3. **Firebase Console** → Authentication → Users screenshot
4. **Browser version** and any extensions
5. **Exact steps** to reproduce

---

## Known Firebase Auth Multi-Tab Behavior

**Normal Behavior**:
- Auth state syncs across tabs via `localStorage`
- `onAuthStateChanged` fires in all tabs when state changes
- Logout in one tab logs out all tabs
- Login in one tab logs in all tabs

**Your Issue**:
- Login in Tab B **logouts** Tab A (abnormal)
- Suggests something is calling `signOut()` or clearing state

**Most Likely Cause**:
- Protected route redirect logic
- Navigation guard calling logout
- State initialization issue
- Race condition in auth listener

Let's add the debug logging to find out! 🔍
