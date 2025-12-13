# Firestore Database Structure

## Collections Overview

```
firestore/
├── users/
│   └── {userId}/
│       ├── (user data: name, email, userId, createdAt)
│       └── friends/
│           └── {friendId}/
│               └── (friend data: name, addedAt)
│
├── friendRequests/
│   └── {requestId}/
│       └── (request data: fromUserId, toUserId, status, createdAt)
│
├── conversations/
│   └── {conversationId}/
│       └── messages/
│           └── {messageId}/
│               └── (message data: senderId, content, timestamp, type, etc.)
│
└── servers/
    └── {serverId}/
        ├── (server data: name, owner, isPublic, icon, place, description)
        ├── channels: [array of channel objects]
        ├── categories: [array of category objects]
        └── members/
            └── {userId}/
                └── (member data: joinedAt, role)
```

## Detailed Structure

### 1. Users Collection
**Path**: `/users/{userId}`

**Document Fields**:
```typescript
{
  id: string;              // User ID
  name: string;            // Full name
  email: string;           // Email address
  userId: string;          // Same as document ID
  createdAt: Timestamp;    // Account creation time
}
```

**Sub-collection**: `friends`
**Path**: `/users/{userId}/friends/{friendId}`
```typescript
{
  name: string;
  addedAt: Timestamp;
}
```

---

### 2. Friend Requests Collection
**Path**: `/friendRequests/{requestId}`

**Document Fields**:
```typescript
{
  id: string;              // Request ID
  fromUserId: string;      // Sender's user ID
  fromUserName: string;    // Sender's name
  toUserId: string;        // Recipient's user ID
  toUserName: string;      // Recipient's name
  status: "pending" | "accepted";
  createdAt: Timestamp;
}
```

---

### 3. Conversations Collection
**Path**: `/conversations/{conversationId}`

**Conversation ID Format**: 
- For DMs: `{userId1}_{userId2}` (sorted alphabetically)
- For channels: `{serverId}_{channelId}`

**Sub-collection**: `messages`
**Path**: `/conversations/{conversationId}/messages/{messageId}`

**Message Fields**:
```typescript
{
  id: string;                    // Message ID
  senderId: string;              // Sender's user ID
  senderName: string;            // Sender's name
  content: string;               // Message text
  timestamp: number;             // Unix timestamp
  conversationId: string;        // Parent conversation ID
  type: "text" | "photo" | "poll";
  createdAt: Timestamp;
  
  // Optional fields
  photoUrl?: string;             // For photo messages
  poll?: {                       // For poll messages
    id: string;
    title: string;
    options: Array<{
      id: string;
      text: string;
      votes: string[];           // Array of user IDs who voted
    }>;
    createdBy: string;
  };
  
  // Deletion tracking
  deletedForEveryone?: boolean;  // Message deleted for all users
  deletedFor?: string[];         // Array of user IDs who deleted for themselves
}
```

---

### 4. Servers Collection
**Path**: `/servers/{serverId}`

**Server ID Format**: `server_{timestamp}`

**Document Fields**:
```typescript
{
  name: string;                  // Server name
  owner: string;                 // Owner's user ID
  isPublic: boolean;             // Public or private server
  icon?: string;                 // Server icon URL/emoji
  place?: string;                // Location/place name
  description?: string;          // Server description
  createdAt: Timestamp;
  
  // Embedded arrays
  channels: Array<{
    id: string;                  // Channel ID (e.g., "channel_1234567890")
    name: string;                // Channel name (e.g., "general")
    type: "text" | "voice";
    categoryId: string;          // Parent category ID
  }>;
  
  categories: Array<{
    id: string;                  // Category ID (e.g., "cat_1")
    name: string;                // Category name (e.g., "TEXT MESSAGES")
  }>;
}
```

**Sub-collection**: `members`
**Path**: `/servers/{serverId}/members/{userId}`

**Member Fields**:
```typescript
{
  joinedAt: Timestamp;
  role: "owner" | "admin" | "member";
}
```

---

## Current Implementation

### Server Data Storage
Currently, channels and categories are stored as **arrays within the server document**:
- ✅ Simpler structure
- ✅ Atomic updates
- ✅ All data in one read
- ⚠️ Limited to 1MB per document (Firestore limit)
- ⚠️ Less flexible for future scaling

### Alternative Structure (For Future)
If servers grow large, consider moving to sub-collections:

```
servers/
└── {serverId}/
    ├── (server metadata only)
    ├── channels/
    │   └── {channelId}/
    │       ├── (channel metadata)
    │       └── messages/
    │           └── {messageId}/
    └── categories/
        └── {categoryId}/
```

---

## Query Patterns

### Get all servers
```typescript
const serversRef = collection(db, "servers");
const snapshot = await getDocs(serversRef);
```

### Get server members count
```typescript
const membersRef = collection(db, `servers/${serverId}/members`);
const snapshot = await getDocs(membersRef);
const memberCount = snapshot.size;
```

### Get messages for a conversation
```typescript
const messagesRef = collection(db, `conversations/${conversationId}/messages`);
const q = query(messagesRef, orderBy("timestamp", "asc"));
const unsubscribe = onSnapshot(q, (snapshot) => {
  // Handle messages
});
```

### Get friend requests for a user
```typescript
const requestsRef = collection(db, "friendRequests");
const q = query(
  requestsRef,
  where("toUserId", "==", currentUserId),
  where("status", "==", "pending"),
  orderBy("createdAt", "desc")
);
```

---

## Indexes Required

### Friend Requests
**Collection**: `friendRequests`
- Fields: `toUserId` (Ascending), `status` (Ascending), `createdAt` (Descending)
- Purpose: Query pending requests efficiently

### Messages
**Collection**: `conversations/{conversationId}/messages`
- Fields: `timestamp` (Ascending)
- Purpose: Order messages chronologically

---

## Best Practices

1. **Always use Timestamps**: Use `Timestamp.now()` for all date fields
2. **Consistent ID formats**: Use prefixes (e.g., `server_`, `channel_`, `cat_`)
3. **Real-time listeners**: Use `onSnapshot()` for live updates
4. **Batch writes**: Group related updates when possible
5. **Error handling**: Always wrap Firestore calls in try-catch
6. **Offline support**: Sync critical data to localStorage

---

## Security Considerations

- All read operations are public (for discovery)
- Write operations should be restricted to authenticated users
- Server owners can update/delete their servers
- Message deletion uses soft deletes (flags, not actual deletion)
- See `FIRESTORE_RULES.md` for detailed security rules

---

**Last Updated**: November 9, 2025
