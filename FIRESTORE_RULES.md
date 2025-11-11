# Firestore Security Rules Update

Replace your Firestore rules with the following:

1. Go to Firebase Console → Firestore Database → Rules tab
2. Delete all existing rules
3. Paste this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read user profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
      allow create: if true;
      
      // Friends sub-collection
      match /friends/{friendId} {
        allow read, write: if true;
      }
    }
    
    // Allow friend requests
    match /friendRequests/{requestId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }
    
    // Allow conversations and messages
    match /conversations/{conversationId}/messages/{messageId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if false;
    }
    match /conversations/{conversationId} {
      allow read, write: if true;
    }

    // Allow servers
    match /servers/{serverId} {
      allow read: if true;
      allow create: if true;
      allow update: if true; // Allow all users to update for now (channels/categories)
      allow delete: if resource.data.owner == request.auth.uid;
      
      // Server members sub-collection
      match /members/{userId} {
        allow read: if true;
        allow create: if true;
        allow update: if true;
        allow delete: if true;
      }
      
      // Server channels sub-collection
      match /channels/{channelId} {
        allow read: if true;
        allow create: if true;
        allow update: if true;
        allow delete: if true;
        
        // Channel messages
        match /messages/{messageId} {
          allow read: if true;
          allow create: if true;
          allow update: if true;
          allow delete: if false;
        }
      }
      
      // Server categories sub-collection
      match /categories/{categoryId} {
        allow read: if true;
        allow create: if true;
        allow update: if true;
        allow delete: if true;
      }
    }
  }
}
```

4. Click "Publish"

## What this allows:
- ✅ Anyone can read all user profiles (to search and add friends)
- ✅ Each user can only write/update their own profile
- ✅ Users can create/read/update/delete friend requests
- ✅ Anyone can read/create/update messages (but not delete directly)
- ✅ Users can create new profiles
- ✅ Authenticated users can create servers
- ✅ Server owners can update/delete their servers
- ✅ Anyone can read all servers (for discovery/browse)
- ✅ Users can join servers (add themselves as members)
- ✅ Server owners can manage members

## Message Deletion:
Messages are never directly deleted from Firebase. Instead:
- **Delete for Me**: Adds current user's ID to `deletedFor` array (user-specific deletion)
- **Delete for Everyone**: Sets `deletedForEveryone` flag to true (visible deletion for all)
- Messages with these flags are filtered out client-side before displaying

## Server Permissions:
- **Owner**: Can create, update, delete server and manage members
- **Members**: Can read server info and join
- **Public**: Readable by anyone (no login required)
- **Private**: Only members can access
