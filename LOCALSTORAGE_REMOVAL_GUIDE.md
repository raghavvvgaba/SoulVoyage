# localStorage Removal - Implementation Guide

## ✅ What Has Been Done

### 1. Updated AuthContext
**File**: `src/context/AuthContext.tsx`

**Changes**:
- ✅ Added `currentProfile` state with user data from Firestore
- ✅ Automatically fetches user profile when authenticated
- ✅ Provides `currentProfile` object with: `id`, `name`, `email`, `userId`
- ✅ Added `refreshProfile()` function to reload profile data

**Usage**:
```typescript
const { currentProfile } = useAuth();
// currentProfile.id, currentProfile.name, currentProfile.userId
```

### 2. Updated MainPage.tsx (Partial)
**Changes Made**:
- ✅ Removed localStorage for messages initialization
- ✅ Removed localStorage for servers initialization  
- ✅ Removed localStorage for friends
- ✅ Removed localStorage sync for servers
- ✅ Use `currentProfile` from AuthContext instead of localStorage
- ✅ Updated friend/message listeners to use currentProfile

**Still Has localStorage** (need to replace):
- ⚠️ ~17 occurrences of `localStorage.getItem("currentProfileId")`
- ⚠️ ~3 occurrences of `localStorage.getItem("currentProfileName")`
- ⚠️ ~1 occurrence of `localStorage.getItem("profiles")`

---

## 🔧 What Needs To Be Done

### Files That Need Updates:

#### 1. **MainPage.tsx** (Critical)
**Remaining localStorage usage**: 17+ occurrences

**Replace Pattern**:
```typescript
// OLD
const currentProfileId = localStorage.getItem("currentProfileId") || "unknown";
const currentProfileName = localStorage.getItem("currentProfileName") || "User";

// NEW  
const { currentProfile } = useAuth(); // at top of component
const currentProfileId = currentProfile?.userId || "unknown";
const currentProfileName = currentProfile?.name || "User";
```

**Specific Lines to Update** (approximate line numbers):
- Line 585: Friend request handling
- Line 648: Message sending
- Line 700: Poll creation
- Line 750: Photo upload
- Line 793: Message deletion
- Line 828: Bulk deletion
- Line 870: Poll voting
- Line 988: Profile loading
- Line 1007: Profiles fallback
- Line 1043: Add friend handler
- Line 1083: Accept friend
- Line 1119: Reject friend
- Line 1485: Message context menu
- Line 1998: Message selection
- Line 2039: Delete dialog
- Line 2051: Fullscreen photo

#### 2. **ServerSettings.tsx**
Check for localStorage usage for server operations

#### 3. **EditProfile.tsx**
Replace localStorage profile management with Firestore

#### 4. **Friends.tsx**
Update friend management to use currentProfile from Auth

#### 5. **ChangeProfiles.tsx**
**This needs major refactoring** - entire multi-profile system

#### 6. **SignupAuth.tsx**
Remove localStorage profile creation

#### 7. **ProfileMenu.tsx**
Update to use currentProfile from Auth

#### 8. **hooks/useServers.ts**
Already partially updated, verify no localStorage remains

#### 9. **services/firestoreService.ts**
Check for any localStorage fallbacks

---

## 📋 Complete Replacement Strategy

### Phase 1: Update All Components to Use AuthContext

**Step 1**: Import useAuth in every file
```typescript
import { useAuth } from "@/context/AuthContext";
```

**Step 2**: Get currentProfile at component top
```typescript
const { currentProfile } = useAuth();
const currentProfileId = currentProfile?.userId;
const currentProfileName = currentProfile?.name;
```

**Step 3**: Replace all occurrences
```typescript
// Find and replace ALL instances of:
localStorage.getItem("currentProfileId") 
// with:
currentProfile?.userId

// Find and replace ALL instances of:
localStorage.getItem("currentProfileName")
// with:
currentProfile?.name
```

### Phase 2: Remove Multi-Profile System (Optional)

The current multi-profile system stores multiple profiles in localStorage. 

**Two options**:

**Option A**: Keep multi-profile but store in Firestore
- Create `/users/{userId}/profiles/{profileId}` sub-collection
- Store all profiles in Firestore
- Update ChangeProfiles.tsx to load from Firestore

**Option B**: Simplify to single profile per user
- Remove ChangeProfiles.tsx completely
- One Firebase Auth user = One profile
- Simpler and more standard approach

**Recommendation**: Option B (single profile per user)

### Phase 3: Handle Edge Cases

**When currentProfile is null**:
```typescript
if (!currentProfile) {
  toast({
    title: "Error",
    description: "Please log in to continue",
    variant: "destructive",
  });
  navigate("/login-auth");
  return;
}
```

---

## 🔄 Migration Strategy for Existing Users

### Current localStorage Structure:
```
- currentProfileId
- currentProfileName  
- userProfiles (array of profiles)
- profiles (array)
- soulVoyageFriends
- soulVoyageServers
- soulVoyageMessages
- defaultServersMigrated
```

### After Migration:
**All data in Firestore**:
```
/users/{userId}/
  ├── name, email, userId, createdAt
  ├── friends/{friendId}/
  └── (no need for separate profiles)

/servers/{serverId}/
  ├── Full server data
  └── members/{userId}/

/conversations/{conversationId}/messages/{messageId}/
  └── All messages
```

### Migration Steps for Live Users:

**If you have existing users**:

1. **Create migration script** to move localStorage data to Firestore
2. **Keep backwards compatibility** for 1-2 weeks
3. **Show migration banner** to users
4. **Auto-migrate on login** if possible

**Migration Script Example**:
```typescript
const migrateUserData = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  // Get data from localStorage
  const oldFriends = JSON.parse(localStorage.getItem("soulVoyageFriends") || "[]");
  
  // Migrate to Firestore
  for (const friend of oldFriends) {
    await setDoc(doc(db, `users/${userId}/friends/${friend.id}`), {
      name: friend.name,
      addedAt: Timestamp.now(),
    });
  }
  
  // Clear localStorage after migration
  localStorage.removeItem("soulVoyageFriends");
};
```

---

## 🎯 Quick Fix for MainPage.tsx

Since MainPage has the most localStorage usage, here's a targeted fix:

**At the top of the component**, add these helper variables:
```typescript
const MainPage = () => {
  const { currentProfile } = useAuth();
  const navigate = useNavigate();
  
  // Early return if no profile
  if (!currentProfile) {
    navigate("/login-auth");
    return null;
  }
  
  // Use these throughout the component
  const currentProfileId = currentProfile.userId;
  const currentProfileName = currentProfile.name;
  
  // ... rest of component
};
```

Then use **Find & Replace** in your editor:
1. Find: `localStorage.getItem("currentProfileId")`
2. Replace: `currentProfileId`

3. Find: `localStorage.getItem("currentProfileName")`
4. Replace: `currentProfileName`

---

## ⚠️ Important Notes

### Authentication Required
After removing localStorage, users **must be authenticated** to use the app. Make sure:
- ProtectedRoute is working
- Login/Signup flows create Firestore user documents
- All pages check for `currentProfile`

### Testing Checklist
After removal:
- [ ] Login and check profile loads
- [ ] Create server - works and saves to Firestore
- [ ] Send message - works without localStorage
- [ ] Add friend - works without localStorage
- [ ] Refresh page - data persists from Firestore
- [ ] Logout and login - profile loads correctly
- [ ] Clear browser cache - still works

---

## 📝 Files Requiring Updates (Priority Order)

### High Priority (Core Functionality)
1. ✅ `src/context/AuthContext.tsx` - DONE
2. ⚠️ `src/pages/MainPage.tsx` - PARTIAL (needs completion)
3. ⚠️ `src/pages/SignupAuth.tsx` - Remove localStorage profile creation
4. ⚠️ `src/pages/LoginAuth.tsx` - Remove localStorage profile loading
5. ⚠️ `src/components/ProfileMenu.tsx` - Use currentProfile

### Medium Priority
6. ⚠️ `src/pages/Friends.tsx` - Use currentProfile
7. ⚠️ `src/pages/EditProfile.tsx` - Update to Firestore only
8. ⚠️ `src/pages/ServerSettings.tsx` - Remove localStorage

### Low Priority (Can be simplified)
9. ⚠️ `src/pages/ChangeProfiles.tsx` - Consider removing entirely
10. ⚠️ `src/hooks/useServers.ts` - Verify no localStorage
11. ⚠️ `src/services/firestoreService.ts` - Check for localStorage fallbacks

---

## 🚀 Recommended Approach

### Quickest Path:
1. **Complete MainPage.tsx updates** (replace all localStorage refs)
2. **Update SignupAuth.tsx** - Save profile to Firestore only
3. **Update LoginAuth.tsx** - Load profile from Firestore
4. **Remove ChangeProfiles** feature entirely (simplify to 1 profile per user)
5. **Update ProfileMenu** to use currentProfile
6. **Test thoroughly**

### Time Estimate:
- MainPage.tsx: 30-45 minutes
- Other files: 1-2 hours
- Testing: 30 minutes
- **Total**: 2-3 hours

---

## 💡 Benefits After Removal

✅ **Real-time sync** - All devices stay in sync
✅ **No data loss** - Data persists even if localStorage cleared
✅ **Simpler code** - One source of truth (Firestore)
✅ **Better security** - Data protected by Firestore rules
✅ **Multi-device** - Same data on phone, tablet, desktop
✅ **Offline support** - Firestore has built-in offline caching

---

## ❓ Questions to Consider

1. **Do you want multi-profile support?**
   - If YES: Move profiles to Firestore sub-collection
   - If NO: Remove ChangeProfiles.tsx entirely (**recommended**)

2. **What about offline support?**
   - Firestore has automatic offline caching
   - No need for manual localStorage

3. **Migration for existing users?**
   - If you have live users: Create migration script
   - If this is development: Just clear localStorage

---

**Next Step**: Update MainPage.tsx to replace all localStorage references with currentProfile from AuthContext.

Would you like me to complete the MainPage.tsx updates now?
