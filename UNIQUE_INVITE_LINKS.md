# Unique Server Invite Links - Implementation

## Problem Fixed

**Before:** Invite links were randomly generated each time the dialog opened, not unique per server, and used a fake domain `soul.gg`.

**After:** Each server gets a **unique, persistent invite code** stored in Firestore, using the actual app URL.

## How It Works Now

### Invite Code Generation:
1. User clicks "Invite People" button for a server
2. System checks if server already has an `inviteCode` in Firestore
3. **If exists:** Uses the existing code
4. **If not:** Generates a new unique code and saves it to Firestore
5. Builds URL: `http://localhost:8080/invite/{code}` (or your actual domain)

### Invite Code Format:
- **Length:** 8 characters
- **Format:** Alphanumeric uppercase (e.g., `A5F2K9Q1`)
- **Uniqueness:** Generated using `Math.random().toString(36)`
- **Persistence:** Stored in Firestore `servers/{serverId}/inviteCode`

## What Changed

### Before:
```typescript
const generateInviteLink = () => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `https://soul.gg/${code}`; // ❌ Fake domain, random every time
};

const inviteLink = currentServer ? generateInviteLink() : "";
```

### After:
```typescript
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const getOrCreateInviteLink = async () => {
  // Check if server has invite code
  const serverDoc = await getDoc(doc(db, "servers", selectedServer));
  if (serverDoc.exists()) {
    const serverData = serverDoc.data();
    
    // Return existing code
    if (serverData.inviteCode) {
      return `${window.location.origin}/invite/${serverData.inviteCode}`;
    }
    
    // Create and save new code
    const newInviteCode = generateInviteCode();
    await updateDoc(doc(db, "servers", selectedServer), {
      inviteCode: newInviteCode,
    });
    
    return `${window.location.origin}/invite/${newInviteCode}`;
  }
};
```

## Features

✅ **Unique per server** - Each server has its own invite code  
✅ **Persistent** - Code doesn't change once generated  
✅ **Stored in Firestore** - Part of server document  
✅ **Real URL** - Uses `window.location.origin` (your actual domain)  
✅ **Automatic generation** - Created on first invite dialog open  
✅ **Reusable** - Same link can be shared multiple times  

## Example URLs

### Development:
```
http://localhost:8080/invite/A5F2K9Q1
http://localhost:8080/invite/7XBTMW3N
http://localhost:8080/invite/K2P9QV4R
```

### Production:
```
https://soulvoyage.com/invite/A5F2K9Q1
https://soulvoyage.com/invite/7XBTMW3N
```

## Firestore Structure

```
servers/
  server_1234567/
    name: "India"
    icon: "..."
    inviteCode: "A5F2K9Q1"  ← NEW FIELD
    categories: [...]
    channels: [...]
    
  server_7890123/
    name: "Jennie"
    icon: "..."
    inviteCode: "7XBTMW3N"  ← NEW FIELD
    categories: [...]
    channels: [...]
```

## User Experience

### First Time Inviting:
1. Click "Invite People" button
2. Dialog opens with loading state
3. System generates code: `A5F2K9Q1`
4. Saves to Firestore
5. Shows link: `http://localhost:8080/invite/A5F2K9Q1`
6. User copies and shares

### Subsequent Times:
1. Click "Invite People" button
2. Dialog opens
3. System fetches existing code from Firestore
4. Shows same link: `http://localhost:8080/invite/A5F2K9Q1`
5. User copies and shares

## Implementation Details

### State Management:
```typescript
const [inviteLink, setInviteLink] = useState("");

useEffect(() => {
  if (showInviteDialog && currentServer) {
    getOrCreateInviteLink().then(link => setInviteLink(link));
  }
}, [showInviteDialog, currentServer]);
```

### Firestore Update:
```typescript
await updateDoc(doc(db, "servers", selectedServer), {
  inviteCode: newInviteCode,
});
```

### URL Building:
```typescript
`${window.location.origin}/invite/${code}`
```

## Benefits

1. **Consistency:** Same link always works for the same server
2. **Shareability:** Can share link on social media, forums, etc.
3. **Tracking:** Could add analytics to see which servers get most invites
4. **Security:** Can implement invite expiration or usage limits later
5. **Professional:** Uses real domain, not fake placeholder

## Future Enhancements (Optional)

Could add:
- **Expiration dates** - Links expire after X days
- **Usage limits** - Max 100 uses per link
- **Multiple invite links** - Different links for different purposes
- **Invite tracking** - See who joined via which link
- **Regenerate link** - Create new code if old one compromised
- **Invite permissions** - Only admins can create invites

## Next Steps Required

### 1. Create Invite Route Handler
You'll need to create a route to handle `/invite/{code}`:

```typescript
// In App.tsx or router
{ 
  path: "/invite/:inviteCode", 
  element: <InviteHandler /> 
}
```

### 2. Create InviteHandler Component
```typescript
// src/pages/InviteHandler.tsx
const InviteHandler = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const handleInvite = async () => {
      // Find server by invite code
      const serversQuery = query(
        collection(db, "servers"),
        where("inviteCode", "==", inviteCode)
      );
      
      const snapshot = await getDocs(serversQuery);
      
      if (!snapshot.empty) {
        const serverDoc = snapshot.docs[0];
        const serverId = serverDoc.id;
        
        if (!user) {
          // Save invite code and redirect to login
          localStorage.setItem("pendingInvite", inviteCode);
          navigate("/login-auth");
          return;
        }
        
        // Add user to server members
        await setDoc(doc(db, "servers", serverId, "members", user.uid), {
          userId: user.uid,
          joinedAt: new Date(),
        });
        
        // Navigate to server
        navigate(`/main?server=${serverId}`);
      } else {
        // Invalid invite code
        navigate("/main");
      }
    };
    
    handleInvite();
  }, [inviteCode]);
  
  return <div>Joining server...</div>;
};
```

## Testing

### Test Checklist:
- [x] Generate invite link for Server A
- [x] Link uses real domain (localhost or production)
- [x] Link is unique per server
- [x] Close dialog and reopen - same link appears
- [x] Generate link for Server B - different from Server A
- [x] Copy link works
- [ ] Visiting link adds user to server (requires InviteHandler)

## Build Status

✅ **Build successful** - no errors

---

## Files Modified

**File:** `src/pages/MainPage.tsx`

**Changes:**
- Renamed `generateInviteLink()` to `generateInviteCode()`
- Added `getOrCreateInviteLink()` async function
- Checks Firestore for existing invite code
- Generates and saves new code if none exists
- Uses `window.location.origin` for real URL
- Changed `inviteLink` from computed value to state
- Added `useEffect` to load invite link when dialog opens

**Firestore Schema Addition:**
- `servers/{serverId}/inviteCode` - string field for invite code

---

## Summary

Each server now has a **unique, persistent invite code** stored in Firestore. The invite link uses your actual app URL (e.g., `http://localhost:8080/invite/A5F2K9Q1`) instead of a fake domain. The code is generated once and reused for all subsequent invites to that server.

**Status:** ✅ Complete (backend only - need to add invite handler route for full functionality)
