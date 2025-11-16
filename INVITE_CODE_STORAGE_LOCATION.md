# Where Invite Codes Are Stored

## Storage Location

**Firestore Database:**  
```
Collection: servers
Document: {serverId}
Field: inviteCode
```

## Visual Structure

### In Firebase Console:

```
Firestore Database
└── servers (collection)
    ├── server_1762842580910
    │   ├── name: "India"
    │   ├── icon: "..."
    │   ├── owner: "IwRKgZCCpebL7gQFxShFrxbNMEO2"
    │   ├── isPublic: true
    │   ├── inviteCode: "A5F2K9Q1"  ← STORED HERE
    │   ├── categories: [...]
    │   ├── channels: [...]
    │   └── createdAt: timestamp
    │
    └── server_9876543210123
        ├── name: "Jennie"
        ├── icon: "..."
        ├── owner: "xe8DbWCAsAS4P1oppMLi08F1b7P2"
        ├── isPublic: true
        ├── inviteCode: "7XBTMW3N"  ← STORED HERE
        ├── categories: [...]
        ├── channels: [...]
        └── createdAt: timestamp
```

## Code That Stores It

### Location in Code:
**File:** `src/pages/MainPage.tsx`  
**Function:** `getOrCreateInviteLink()`

```typescript
// Generate new invite code and save to Firestore
const newInviteCode = generateInviteCode();

await updateDoc(doc(db, "servers", selectedServer), {
  inviteCode: newInviteCode,
});
```

### Full Context:
```typescript
const getOrCreateInviteLink = async () => {
  if (!currentServer || !selectedServer) return "";

  try {
    // Check if server already has an invite code
    const serverDoc = await getDoc(doc(db, "servers", selectedServer));
    
    if (serverDoc.exists()) {
      const serverData = serverDoc.data();
      
      // If invite code exists, use it
      if (serverData.inviteCode) {
        return `${window.location.origin}/invite/${serverData.inviteCode}`;
      }
      
      // Generate new invite code and save to Firestore
      const newInviteCode = generateInviteCode();
      
      // THIS IS WHERE IT'S SAVED:
      await updateDoc(doc(db, "servers", selectedServer), {
        inviteCode: newInviteCode,  // ← Saved as a field in the server document
      });
      
      return `${window.location.origin}/invite/${newInviteCode}`;
    }
  } catch (error) {
    console.error("Error getting/creating invite link:", error);
  }
  
  return "";
};
```

## How to View in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in left sidebar
4. Click on **servers** collection
5. Click on any server document (e.g., `server_1762842580910`)
6. You'll see a field called **`inviteCode`** with a value like `A5F2K9Q1`

### Screenshot Guide:
```
Firebase Console View:

┌────────────────────────────────────────────┐
│ servers / server_1762842580910             │
├────────────────────────────────────────────┤
│ Field              Value                   │
├────────────────────────────────────────────┤
│ name               "India"                 │
│ icon               "data:image/png..."     │
│ owner              "IwRKgZC..."            │
│ isPublic           true                    │
│ inviteCode         "A5F2K9Q1"  ← HERE!    │
│ place              "Location"              │
│ description        ""                      │
│ categories         [array]                 │
│ channels           [array]                 │
│ createdAt          November 16, 2025...    │
└────────────────────────────────────────────┘
```

## Data Type

**Field Name:** `inviteCode`  
**Type:** `string`  
**Length:** 8 characters  
**Format:** Uppercase alphanumeric (e.g., `A5F2K9Q1`, `7XBTMW3N`)  
**Example Values:**
- `A5F2K9Q1`
- `7XBTMW3N`
- `K2P9QV4R`
- `M8XBTW5L`

## Storage Path Breakdown

```
Firestore Path:
  /servers/{serverId}/inviteCode

Example:
  /servers/server_1762842580910/inviteCode = "A5F2K9Q1"
  /servers/server_9876543210123/inviteCode = "7XBTMW3N"
```

## When It's Created

The `inviteCode` field is created when:
1. User clicks "Invite People" for the first time
2. Dialog opens
3. System checks if `inviteCode` exists
4. If not, generates new code
5. Saves it to Firestore using `updateDoc()`

## When It's Read

The `inviteCode` field is read when:
1. User clicks "Invite People"
2. System queries Firestore: `getDoc(doc(db, "servers", selectedServer))`
3. Checks if `serverData.inviteCode` exists
4. If exists, uses it to build URL
5. Displays in dialog

## Storage Size

- **Per invite code:** ~8 bytes (8 characters)
- **Per server:** 1 additional field in server document
- **Cost:** Negligible (part of existing server document)

## Security Rules

Make sure your Firestore rules allow reading `inviteCode`:

```firestore
match /servers/{serverId} {
  allow read: if true;  // Anyone can read (including inviteCode)
  allow update: if request.auth != null;  // Authenticated users can update
}
```

## Example Document in Firestore

```json
{
  "name": "India",
  "icon": "data:image/png;base64,...",
  "owner": "IwRKgZCCpebL7gQFxShFrxbNMEO2",
  "isPublic": true,
  "place": "Location",
  "description": "",
  "inviteCode": "A5F2K9Q1",  ← THIS FIELD
  "categories": [
    {
      "id": "cat_1",
      "name": "TEXT CHANNELS"
    }
  ],
  "channels": [
    {
      "id": "general_1",
      "name": "general-chat",
      "type": "text",
      "categoryId": "cat_1"
    }
  ],
  "createdAt": {
    "_seconds": 1700000000,
    "_nanoseconds": 0
  }
}
```

## Verification

To verify it's being stored correctly:

### 1. Check in Firebase Console:
- Go to Firestore Database → servers
- Open any server document
- Look for `inviteCode` field

### 2. Check in Browser Console:
```javascript
// After generating an invite link, check Firestore
const serverDoc = await getDoc(doc(db, "servers", "your-server-id"));
console.log(serverDoc.data().inviteCode);
// Should print: "A5F2K9Q1" or similar
```

### 3. Check in Code:
Add this log in your code:
```typescript
const serverData = serverDoc.data();
console.log("📍 Invite code stored:", serverData.inviteCode);
```

## Summary

**Storage Location:** Firestore → `servers` collection → `{serverId}` document → `inviteCode` field

**Structure:**
```
servers/{serverId}.inviteCode = "A5F2K9Q1"
```

**Access:**
- **Write:** `updateDoc(doc(db, "servers", serverId), { inviteCode: code })`
- **Read:** `getDoc(doc(db, "servers", serverId))` then `data().inviteCode`

Simple and efficient - stored as a string field in the existing server document! No separate collection needed.
