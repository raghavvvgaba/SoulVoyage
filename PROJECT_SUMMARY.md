# SoulVoyage - Project Summary

## 📋 Overview

SoulVoyage is a real-time messaging and social platform for solo travelers to connect, plan, and embark on unforgettable adventures together. The application features user authentication, friend management, real-time messaging, and a modern UI built with React, TypeScript, and Tailwind CSS.

---

## ✨ Major Features Implemented

### 1. User Authentication & Profile Management
- **Firebase Authentication** - Email/password signup and login
- **Unique User IDs** - Each user gets a unique, permanent ID (format: `{timestamp}-{randomString}`)
- **Multi-Profile Support** - Users can manage multiple profiles and switch between them
- **Profile Data Storage** - User profiles stored in Firestore and localStorage
- **Edit Profile** - Users can view/edit their profile information
- **User ID Display** - Profile ID visible in Edit Profile with copy-to-clipboard button

### 2. Friend System
- **Friend Requests** - Send requests by entering User ID
- **Real-Time Request Notifications** - Friend requests appear instantly with badge count
- **Accept/Reject** - Accept to add friend or reject to decline
- **Firestore Persistence** - All requests stored in cloud with status tracking
- **Friends List** - View all friends, sorted by most recently added
- **Search Capability** - Find users by their unique User ID

### 3. Real-Time Messaging
- **Direct Messages** - Chat with friends one-on-one
- **Real-Time Sync** - Messages sync instantly across all devices
- **Message Persistence** - All messages stored in Firestore
- **Consistent Conversation IDs** - Both users share the same conversation path (sorted ID combination)
- **Message Display** - Bubbles with different styles for sent vs received
- **Timestamp Tracking** - Messages ordered chronologically
- **Enter Key Support** - Send messages with keyboard Enter key
- **Send Button** - Paper plane icon with blue hover effect

### 4. UI/UX Enhancements
- **Blue Primary Theme** - Consistent teal/blue (#185 84% 48%) throughout
- **Profile Icon** - Blue background matching site theme
- **Navbar Positioning** - Theme toggle and login buttons positioned to the right
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Chat Interface** - Clean message bubbles with sender identification
- **Dropdown Menus** - Add Friend, Friends list, Server menus
- **Message Input** - Plus button with dropdown (Files, Photos, Videos, Poll options)
- **Theme Support** - Light and dark mode switching

### 5. Server Infrastructure
- **Node.js Backend** - Express server running on port 8080
- **WebSocket Server** - Real-time communication on port 8081
- **Concurrent Running** - Both frontend and backend run with `npm run dev`
- **Firebase Admin SDK** - Server can write to Firestore
- **Error Handling** - Comprehensive error logging and management

### 6. Database (Firestore)
- **users Collection** - Stores user profiles with ID, name, email, userId, createdAt
- **conversations Collection** - Sub-collection structure for organized messaging
  - Path: `conversations/{conversationId}/messages/{messageId}`
- **friendRequests Collection** - Tracks all friend requests with status tracking
- **Real-Time Listeners** - Firestore subscriptions for live updates
- **Composite Indexes** - Set up for efficient friend request queries

---

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Page navigation
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Firebase SDK** - Authentication and Firestore
- **next-themes** - Theme management
- **Lucide React** - Icons

### Backend Stack
- **Node.js** - Runtime
- **Express** - Web server
- **WebSocket (ws)** - Real-time communication
- **Firebase Admin SDK** - Firestore access
- **CORS** - Cross-origin requests

### Database
- **Firebase Firestore** - Cloud database
- **Real-Time Listeners** - `onSnapshot()` for live updates
- **Composite Indexes** - For optimized queries

### Hosting
- **Local Development** - `npm run dev` (Vite + Node server)
- **Port 5173** - Frontend (Vite dev server was 8080, now Vite)
- **Port 8080** - Express API server
- **Port 8081** - WebSocket server

---

## 📁 Project Structure

```
SoulVoyage/
├── src/
│   ├── pages/
│   │   ├── MainPage.tsx          # Direct messages & chat hub
│   │   ├── Friends.tsx            # Friends list & requests
│   │   ├── SignupAuth.tsx          # User registration (creates profiles in Firestore)
│   │   ├── LoginAuth.tsx           # User login
│   │   ├── EditProfile.tsx         # Profile editor with User ID display
│   │   ├── ChangeProfiles.tsx      # Multi-profile switcher
│   │   └── ... (other pages)
│   ├── components/
│   │   ├── Navbar.tsx             # Navigation with theme toggle
│   │   ├── ProfileMenu.tsx        # User profile icon with dropdown
│   │   ├── Hero.tsx               # Landing page hero
│   │   └── ... (other components)
│   ├── lib/
│   │   └── firebase.ts            # Firebase initialization & exports
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server/
│   ├── server.js                  # Express + WebSocket server
│   ├── package.json
│   ├── firebase-credentials.json  # Firebase service account (NOT in git)
│   └── .env
├── package.json                   # Frontend dependencies + concurrently
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🔐 Firestore Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - readable by all, writable only by owner
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
      allow create: if true;
    }
    
    // Friend requests - readable and writable by all (for demo)
    match /friendRequests/{requestId} {
      allow read, create, update, delete: if true;
    }
    
    // Conversations and messages
    match /conversations/{conversationId}/messages/{messageId} {
      allow read, write: if true;
    }
    match /conversations/{conversationId} {
      allow read, write: if true;
    }
  }
}
```

---

## 🗄️ Data Models

### User Profile
```typescript
{
  id: string;                 // Unique user ID (e.g., "1730881234-ABC123")
  name: string;              // Full name
  email: string;             // Email address
  userId: string;            // Same as id
  createdAt: Timestamp;      // Account creation time
}
```

### Friend Request
```typescript
{
  id: string;                // Document ID
  fromUserId: string;        // Sender's ID
  fromUserName: string;      // Sender's name
  toUserId: string;          // Receiver's ID
  toUserName: string;        // Receiver's name
  status: "pending" | "accepted";
  createdAt: Timestamp;
}
```

### Message
```typescript
{
  id: string;                // Message ID
  senderId: string;          // Sender's ID
  senderName: string;        // Sender's name
  content: string;           // Message text
  timestamp: number | Timestamp;
  conversationId: string;    // Conversation path (sorted user IDs)
}
```

---

## 🚀 How to Run

### Prerequisites
1. Node.js v18+
2. Firebase project with Firestore and Authentication enabled
3. Firebase service account JSON file

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Environment Setup**
   - Frontend: `.env` file with Firebase credentials (already set up)
   - Backend: `server/.env` with Firebase project ID
   - `server/firebase-credentials.json` - Firebase service account key

3. **Create Firestore Composite Index**
   - Go to Firebase Console → Firestore → Indexes
   - Create index for `friendRequests` collection:
     - `toUserId` (Ascending)
     - `status` (Ascending)
     - `createdAt` (Descending)

4. **Update Firestore Rules**
   - Go to Firebase Console → Firestore → Rules
   - Replace with rules from `FIRESTORE_RULES.md`

5. **Run Application**
   ```bash
   npm run dev
   ```
   This starts:
   - Frontend on http://localhost:5173
   - Express server on http://localhost:8080
   - WebSocket server on ws://localhost:8081

---

## 🧪 Testing Multi-Device

1. **Get Computer IP**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1  # Mac/Linux
   ```

2. **Device A (Localhost)**
   - Open http://localhost:5173

3. **Device B (Same Network)**
   - Open http://{COMPUTER_IP}:5173
   - Both devices on same WiFi network

4. **Test Flow**
   - Sign up User A on Device A
   - Sign up User B on Device B
   - User A: Copy User ID from Edit Profile
   - User B: Add Friend → Paste User A's ID
   - User A: See friend request instantly
   - User A: Accept request
   - User B: See User A in Direct Messages
   - Both: Send messages back and forth in real-time

---

## 📊 Conversation ID Logic

To ensure both users see the same messages, conversation IDs are **sorted combinations** of both user IDs:

```javascript
const getConversationId = (otherUserId) => {
  const currentUserId = localStorage.getItem("currentProfileId");
  return [currentUserId, otherUserId].sort().join("_");
};
```

**Example:**
- User A: `1730881234-ABC`
- User B: `1730881234-XYZ`
- Conversation ID: `1730881234-ABC_1730881234-XYZ`

Both users always generate the same ID regardless of who initiates the chat.

---

## 🔄 Real-Time Flow

### Sending a Message
1. User types and clicks Send
2. Message saved to Firestore at `conversations/{conversationId}/messages/{messageId}`
3. WebSocket notifies server (future enhancement)
4. Firestore listener on receiver's device triggers
5. Message appears instantly in receiver's chat

### Adding a Friend
1. User A sends request with User B's ID
2. Request document created in Firestore `friendRequests` collection
3. Firestore listener on User B's device triggers
4. Badge count updates instantly
5. Friend request appears in User B's list

---

## 📝 Recent Fixes & Enhancements

### Fixed Issues
1. ✅ Default friend requests removed - new users start with 0 requests
2. ✅ Friend request delivery - real-time listeners added to both pages
3. ✅ Message conversation IDs - now sorted for consistency across devices
4. ✅ Message display filtering - uses correct conversation ID format
5. ✅ Firestore composite index - set up for friend request queries

### Enhancements Made
1. ✅ Profile icons now have blue background matching theme
2. ✅ Navbar buttons properly positioned
3. ✅ Removed localStorage-only friend requests (now Firestore-based)
4. ✅ User profiles synced to Firestore on signup
5. ✅ Real-time Firestore listeners for messages and requests

---

## 🎯 Current Limitations & Future Enhancements

### Current State
- Friend requests are basic (accept/reject only)
- No typing indicators
- No message reactions/emojis
- No online/offline status
- No message deletion/editing
- No group conversations
- No voice/video calls

### Possible Enhancements
1. **Typing Indicators** - Show "User is typing..."
2. **Read Receipts** - Show when messages are read
3. **Message Reactions** - Add emoji reactions to messages
4. **Message Search** - Search through message history
5. **Group Chats** - Multiple users in one conversation
6. **Online Status** - Show who's online/offline
7. **Message Deletion** - Allow users to delete sent messages
8. **File Sharing** - Send images, files, documents
9. **Voice Messages** - Record and send audio
10. **End-to-End Encryption** - Encrypt messages for privacy

---

## 🔗 Key Files Modified

- `src/pages/MainPage.tsx` - Messaging hub with real-time features
- `src/pages/SignupAuth.tsx` - Saves user profiles to Firestore
- `src/pages/Friends.tsx` - Friend requests and friends list
- `src/pages/EditProfile.tsx` - Displays User ID with copy button
- `src/lib/firebase.ts` - Firestore initialization
- `src/App.css` - Removed constraining layout rules
- `server/server.js` - WebSocket + Firestore integration
- `package.json` - Added concurrently for parallel execution

---

## 📚 Documentation Files

- `FIRESTORE_RULES.md` - Firestore security rules
- `WEBSOCKET_SETUP.md` - WebSocket server setup guide
- `FRIEND_REQUEST_SYSTEM.md` - Friend request system details
- `PROJECT_SUMMARY.md` - This file

---

## ✅ Completion Checklist

- [x] User authentication with Firebase
- [x] Unique user IDs for each profile
- [x] Multi-profile support
- [x] Friend request system with real-time updates
- [x] Real-time messaging between friends
- [x] Firestore database integration
- [x] WebSocket server setup
- [x] Responsive UI with Tailwind CSS
- [x] Theme switching (light/dark mode)
- [x] Mobile-friendly design
- [x] Cross-device real-time sync
- [x] Error handling and logging
- [x] Firestore composite indexes

---

## 🎉 Project Status

**Status:** ✅ **FULLY FUNCTIONAL**

The SoulVoyage application is now fully functional with:
- User authentication and profile management
- Friend request system with real-time notifications
- Direct messaging with real-time sync
- Multi-device support
- Clean, modern UI
- Reliable backend infrastructure

All major features are working and tested across multiple devices!

---

**Last Updated:** November 7, 2025
**Version:** 1.0.0
