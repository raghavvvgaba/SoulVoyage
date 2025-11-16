# 🧪 Multi-Tab Authentication Test

## Test Scenario: Login in Multiple Tabs

---

## 📋 Test Steps

### Step 1: Setup
1. **Close all browser tabs** for your app
2. **Open DevTools** (F12 or Cmd+Option+I)
3. **Clear Console** so we can see fresh logs

---

### Step 2: First Tab Login
1. **Open Tab 1**: http://localhost:8080
2. **Login as User A** (IwRKgZCCpebL7gQFxShFrxbNMEO2)
3. **Check Console**, you should see:
   ```
   🔐 Firebase Auth - Persistence set to LOCAL
   🔐 AuthContext - Setting up auth listener
   🔐 AuthContext - Auth state changed: {uid: "IwRKgZCCpebL7gQFxShFrxbNMEO2", ...}
   AuthContext - Fetching profile for userId: IwRKgZCCpebL7gQFxShFrxbNMEO2
   AuthContext - Setting currentProfile: {...}
   ```

**✅ PASS**: User A logged in successfully

---

### Step 3: Open Second Tab (Should Auto-Login)
1. **Keep Tab 1 open and console visible**
2. **Open Tab 2**: http://localhost:8080 (new tab, same URL)
3. **Check Tab 2 Console**, should show:
   ```
   🔐 Firebase Auth - Persistence set to LOCAL
   🔐 AuthContext - Setting up auth listener
   🔐 AuthContext - Auth state changed: {uid: "IwRKgZCCpebL7gQFxShFrxbNMEO2", ...}
   ```
   **Same UID as Tab 1** (already logged in automatically)

4. **Check Tab 1 Console** - should still show User A logged in
   - ❌ Should NOT see "User is NULL"
   - ❌ Should NOT see "LOGOUT CALLED"

**✅ PASS**: Tab 2 auto-logged in as same user
**✅ PASS**: Tab 1 still logged in

---

### Step 4: Login Different User in Tab 2 (Critical Test)
1. **In Tab 2**: Click logout
2. **Check BOTH consoles**, should see:
   ```
   🚪 AuthContext - LOGOUT CALLED
   ✅ AuthContext - Logout successful
   🔐 AuthContext - Auth state changed: {uid: "null", ...}
   ```
   **Both tabs should logout**

3. **In Tab 2**: Login as User B (xe8DbWCAsAS4P1oppMLi08F1b7P2)
4. **Check Tab 2 Console**:
   ```
   🔐 AuthContext - Auth state changed: {uid: "xe8DbWCAsAS4P1oppMLi08F1b7P2", ...}
   ```

5. **Check Tab 1 Console** (THE CRITICAL TEST):
   
   **EXPECTED (correct behavior):**
   ```
   🔐 AuthContext - Auth state changed: {uid: "xe8DbWCAsAS4P1oppMLi08F1b7P2", ...}
   ```
   Tab 1 switches to User B ✅

   **IF BROKEN (your original issue):**
   ```
   ⚠️ AuthContext - User is NULL - logged out or not authenticated
   ```
   Tab 1 shows logged out ❌

**✅ PASS**: Both tabs now show User B
**❌ FAIL**: Tab 1 shows logged out or null

---

### Step 5: Test Cross-Tab Sync
1. **In Tab 1**: Logout
2. **Check BOTH consoles**:
   ```
   🚪 AuthContext - LOGOUT CALLED
   ✅ AuthContext - Logout successful
   ```
   **Both tabs should logout**

**✅ PASS**: Logout syncs across tabs

---

## 📊 Expected Results Summary

| Action | Tab 1 | Tab 2 | Result |
|--------|-------|-------|--------|
| Login User A in Tab 1 | User A logged in | - | ✅ |
| Open Tab 2 | User A still logged in | User A auto-logged in | ✅ |
| Logout in Tab 2 | Logged out | Logged out | ✅ |
| Login User B in Tab 2 | Switches to User B | User B logged in | ✅ |
| Logout in Tab 1 | Logged out | Logged out | ✅ |

---

## 🔍 What to Look For

### ✅ Good Logs (Working Correctly):
```
🔐 Firebase Auth - Persistence set to LOCAL
🔐 AuthContext - Setting up auth listener
🔐 AuthContext - Auth state changed: {uid: "xxx", email: "xxx"}
AuthContext - Fetching profile for userId: xxx
AuthContext - Setting currentProfile: {...}
```

### ⚠️ Warning Logs (Check These):
```
⚠️ AuthContext - User is NULL - logged out or not authenticated
```
This should ONLY appear:
- After explicit logout
- When not logged in
- Never randomly

### 🚪 Logout Logs (Should See When Logging Out):
```
🚪 AuthContext - LOGOUT CALLED
Logout call stack:
  at logout (AuthContext.tsx:88)
  at handleLogout (ProfileMenu.tsx:32)
✅ AuthContext - Logout successful
```

### ❌ Bad Behavior (Report These):
1. Tab 1 shows "User is NULL" when Tab 2 logs in
2. Tab 1 shows "LOGOUT CALLED" without clicking logout
3. Tabs show different users simultaneously
4. Auth state doesn't sync across tabs

---

## 🐛 If You Find Issues

### Issue 1: Tab Gets Logged Out Unexpectedly
**Console shows:**
```
🚪 AuthContext - LOGOUT CALLED
```
**Check:** The stack trace will show what triggered it
**Report:** Copy the full stack trace

---

### Issue 2: Tab Shows NULL User
**Console shows:**
```
⚠️ AuthContext - User is NULL
```
**But no logout log**
**Possible causes:**
- Storage cleared by browser extension
- Token refresh failed
- Firestore security rule issue

**Check Network tab** for:
- 401 errors
- Token refresh failures
- "auth" or "identitytoolkit" errors

---

### Issue 3: Tabs Show Different Users
**Tab 1:** User A
**Tab 2:** User B
**Both active simultaneously**

This should NEVER happen with `browserLocalPersistence`

**Report:**
- Console logs from BOTH tabs
- Screenshot of both tabs
- Network tab from both tabs

---

## 📝 Test Results Template

Copy this and fill it out:

```
## Multi-Tab Auth Test Results

**Date:** [date]
**Browser:** [Chrome/Firefox/Safari]
**Browser Version:** [version]

### Step 2: First Tab Login
- [ ] ✅ User A logged in
- [ ] ✅ Console shows correct logs
- [ ] ❌ Issues: [describe]

### Step 3: Second Tab Auto-Login
- [ ] ✅ Tab 2 auto-logged in as User A
- [ ] ✅ Tab 1 still logged in as User A
- [ ] ❌ Issues: [describe]

### Step 4: Different User Login (CRITICAL)
- [ ] ✅ Both tabs logged out first
- [ ] ✅ Tab 2 logged in as User B
- [ ] ✅ Tab 1 switched to User B
- [ ] ❌ Tab 1 showed NULL/logged out
- [ ] ❌ Other issues: [describe]

### Step 5: Cross-Tab Logout
- [ ] ✅ Logout synced to both tabs
- [ ] ❌ Issues: [describe]

### Console Logs
**Tab 1:**
```
[paste console logs]
```

**Tab 2:**
```
[paste console logs]
```

### Overall Result
- [ ] ✅ ALL TESTS PASSED - Multi-tab auth works perfectly
- [ ] ⚠️ SOME ISSUES - Describe: [issues]
- [ ] ❌ MAJOR FAILURE - Describe: [issues]
```

---

## 🎯 What We're Testing

**The specific issue you reported:**
> "when i login in one tab and then when i login in another tab my other tab gets logged out"

**Expected fix:**
- ✅ Both tabs stay logged in
- ✅ Login in Tab 2 switches Tab 1 to same user
- ✅ No unexpected logouts

**If this happens now:**
- ❌ Tab 1 gets logged out when Tab 2 logs in
- ❌ Tab 1 shows NULL user

Then we need to investigate further!

---

## 🚀 Ready to Test?

1. Close all tabs
2. Open this guide in one window
3. Open your app in another window
4. Follow the steps
5. Report back the results!

**Let's see if the fix worked!** 🔍
