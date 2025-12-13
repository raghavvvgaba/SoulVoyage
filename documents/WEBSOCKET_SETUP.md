# WebSocket Server Setup Guide

## Overview
The WebSocket server is located in the `/server` folder and runs alongside your frontend when you run `npm run dev`.

## Initial Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies (if not already done)
npm install concurrently

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Firebase Service Account Setup (IMPORTANT!)

To enable the server to write to Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `soulvoyage-78b27`
3. Click the gear icon (⚙️) → **Project Settings**
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as `server/firebase-credentials.json`

⚠️ **SECURITY WARNING**: Never commit `firebase-credentials.json` to Git! It's in `.gitignore`

### 3. Configure Firestore Security Rules

Go to Firestore → **Rules** and update to allow your app to read/write messages:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Running the Application

### Option 1: Run Both Frontend + Backend (Recommended)
```bash
npm run dev
```
This will start:
- ✅ Vite frontend on `http://localhost:5173`
- ✅ Express server on `http://localhost:8080`
- ✅ WebSocket server on `ws://localhost:8081`

### Option 2: Run Server Only
```bash
npm run server
```

## How It Works

### Architecture
```
Frontend (React) ←→ WebSocket ←→ Server (Node.js/Express)
                                     ↓
                              Firestore Database
```

### Message Flow
1. User types a message and sends it
2. Frontend sends message through WebSocket to server
3. Server receives message and stores it in Firestore
4. Server broadcasts message to all connected clients
5. All clients receive the message in real-time
6. Messages are persisted in Firestore for history

### Collections Structure
```
conversations/
  └── {conversationId}/ (friend ID or channel ID)
      └── messages/
          └── {messageId}
              ├── id: string
              ├── senderId: string
              ├── senderName: string
              ├── content: string
              ├── timestamp: number
              ├── conversationId: string
              └── createdAt: timestamp
```

## Testing

1. **Send a message** in the chat
2. Check **Firestore Console** to see the message stored
3. Open the app in another browser/tab
4. Message should appear in real-time (if WebSocket is connected)

## Troubleshooting

### WebSocket Connection Error
- Make sure server is running on port 8081
- Check browser console for errors
- Verify `ws://localhost:8081` is accessible

### Firestore Write Fails
- Verify `firebase-credentials.json` is in `/server` folder
- Check Firestore security rules
- Ensure your Firebase project has Firestore enabled

### Messages Not Persisting
- Check Firestore collections exist
- Verify security rules allow writes
- Check server logs for errors

## Environment Variables

**Frontend** (`.env`):
- Already configured with Firebase credentials

**Server** (`server/.env`):
```
FIREBASE_PROJECT_ID=soulvoyage-78b27
PORT=8080
WS_PORT=8081
```

## Future Enhancements
- Add user authentication to WebSocket
- Add message encryption
- Add typing indicators
- Add online/offline status
- Add message reactions
- Add file uploads
