# SoulVoyage WebSocket Documentation

## Overview

This document summarizes all WebSocket features implemented in the SoulVoyage chat application. WebSocket enables real-time communication between users for instant messaging, typing indicators, and other real-time features.

## WebSocket Server Configuration

### Server Setup
- **Location**: `server/server.js`
- **Port**: 8081 (WebSocket), 8080 (HTTP Health Check)
- **Library**: `ws` (WebSocket library for Node.js)
- **Protocol**: WebSocket with JSON message format

### Firebase Integration
- Firebase Admin SDK integration for database operations
- Firestore collections for message persistence
- Real-time synchronization between WebSocket and Firestore

## WebSocket Message Types

### 1. Regular Messages
```json
{
  "id": "timestamp-id",
  "senderId": "user-uid",
  "senderName": "Username",
  "content": "Message content",
  "timestamp": 1234567890,
  "conversationId": "dm_user123" | "server_server123_channel_456",
  "type": "text" | "photo" | "file" | "video" | "poll",
  "photoUrl": "data-url-or-storage-url", // for photos/videos
  "fileName": "document.pdf", // for files
  "fileSize": "2.5 MB", // for files
  "replyTo": { // optional reply information
    "id": "message-id",
    "content": "Original message",
    "senderName": "Original sender"
  }
}
```

### 2. Typing Indicators

#### Typing Start Event
```json
{
  "type": "typing_start",
  "conversationId": "dm_user123" | "server_server123_channel_456",
  "userId": "user-uid",
  "userName": "Username",
  "timestamp": 1234567890
}
```

#### Typing Stop Event
```json
{
  "type": "typing_stop",
  "conversationId": "dm_user123" | "server_server123_channel_456",
  "userId": "user-uid",
  "userName": "Username",
  "timestamp": 1234567890
}
```

## Conversation ID Format

### Direct Messages (DMs)
- **Format**: `dm_${userId1}_${userId2}`
- **Example**: `dm_abc123_def456`
- **Generation**: `getConversationId()` function sorts user IDs alphabetically for consistent IDs

### Server Channels
- **Format**: `server_${serverId}_channel_${channelId}`
- **Example**: `server_server123_channel_456`
- **Usage**: For server-based conversations

## Real-time Features

### 1. Instant Messaging
- **Feature**: Real-time message delivery
- **Implementation**: WebSocket broadcasts messages to all users in conversation
- **Storage**: Messages persisted to Firestore
- **Synchronization**: WebSocket + Firestore ensures message delivery

### 2. Typing Indicators
- **Feature**: Show when users are typing
- **Triggers**: `onChange`, `onKeyDown`, `onKeyUp` events on message input
- **Visibility**:
  - Other users see: "Username is typing..." with animated dots
  - Current user: Never sees their own typing indicator
- **Timeout**: Auto-hide after 3 seconds of inactivity
- **Cleanup**: Remove stale indicators after 5 seconds

### 3. Message Types Support
- **Text Messages**: Standard chat messages
- **Photos**: Image sharing with preview
- **Videos**: Video sharing with HTML5 player
- **Files**: Document sharing with download UI
- **Polls**: Interactive voting system
- **Replies**: Threaded conversations with reply context

## Client-Side Implementation

### WebSocket Connection Management
```typescript
// Connection setup
const wsRef = useRef<WebSocket | null>(null);
const wsUrl = import.meta.env.VITE_WS_URL;
wsRef.current = new WebSocket(wsUrl);

// Message handling
wsRef.current.onmessage = (event) => {
  const receivedMessage = JSON.parse(event.data);
  // Handle different message types
};

// Sending messages
if (wsRef.current?.readyState === WebSocket.OPEN) {
  wsRef.current.send(JSON.stringify(messageData));
}
```

### State Management
- **Messages**: Real-time message updates via WebSocket + Firestore sync
- **Typing Users**: Map of currently typing users with timestamps
- **Connection Status**: Track WebSocket connection state

### Message Flow
1. User sends message → WebSocket broadcast → Firestore storage
2. WebSocket delivers to all connected users in conversation
3. Firestore listeners update message state for persistence
4. UI updates with new messages in real-time

## Server-Side Implementation

### Message Broadcasting
```javascript
// Broadcast to all subscribers in conversation
if (connections.has(message.conversationId)) {
  const clients = connections.get(message.conversationId);
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(messageData));
    }
  });
}
```

### Connection Management
- **connections**: Map of conversationId → Set of WebSocket clients
- **clientSubscriptions**: Map of WebSocket → Set of conversationIds
- Automatic cleanup on disconnect

## Error Handling & Resilience

### Client-Side
- **Connection Loss**: Automatic reconnection attempts
- **Message Duplication**: Prevent duplicate message display
- **Fallback**: Firestore real-time listeners if WebSocket fails

### Server-Side
- **Port Conflicts**: Graceful error handling
- **Client Disconnection**: Proper cleanup of subscriptions
- **Message Validation**: Basic validation of incoming messages

## File Upload Integration

### Upload Process
1. **Client**: FileReader converts file to data URL
2. **WebSocket**: Broadcasts file information immediately
3. **Firestore**: Persists file metadata and data URL
4. **Display**: Renders appropriate UI component (image viewer, video player, file card)

### Supported File Types
- **Photos**: `image/*` - Display with image viewer
- **Videos**: `video/*` - Display with HTML5 video player
- **Files**: Documents, PDFs, archives - Display with file card UI

## Reply System Integration

### Reply Flow
1. **User Actions**: Right-click message → Select "Reply"
2. **Preview**: Shows reply context above message input
3. **Sending**: Message includes `replyTo` field with original message info
4. **Display**: Replies show original message context in chat bubble

### Reply Data Structure
```typescript
{
  replyTo: {
    id: string;           // Original message ID
    content: string;      // Original message content
    senderName: string;   // Original sender name
  }
}
```

## Performance Optimizations

### Client-Side
- **Debouncing**: Prevent excessive typing indicator broadcasts
- **Cleanup**: Regular removal of stale typing indicators
- **Efficient Updates**: Use functional state updates to prevent race conditions

### Server-Side
- **Connection Pooling**: Efficient client management per conversation
- **Memory Management**: Automatic cleanup of disconnected clients
- **Message Validation**: Lightweight validation to prevent spam

## Security Considerations

### Authentication
- **Firebase Auth**: User authentication through Firebase
- **User Validation**: Verify user permissions for conversations
- **Message Validation**: Basic validation of message structure

### Privacy
- **Conversation Isolation**: Messages only broadcast to conversation participants
- **User Filtering**: Typing indicators filtered by conversation membership
- **Data Sanitization**: Basic sanitization of user input

## Development & Debugging

### Environment Variables
```bash
VITE_WS_URL=ws://localhost:8081
```

### Console Logging
- **WebSocket Events**: Connection status, message sending/receiving
- **Typing Events**: Start/stop typing broadcasts
- **Message Events**: Message creation and broadcasting

### Testing
- **Multiple Browser Windows**: Test real-time updates
- **Network Throttling**: Test behavior under poor connectivity
- **Connection Loss**: Test reconnection behavior

## Future Enhancements

### Planned Features
- **Read Receipts**: Message read status indicators
- **Presence Indicators**: Online/offline status
- **Reactions**: Emoji reactions to messages
- **File Sharing**: Improved file sharing with cloud storage

### Scalability
- **Redis Integration**: For horizontal scaling
- **Load Balancing**: Multiple WebSocket servers
- **Message Queues**: For reliable message delivery

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Maintainer**: SoulVoyage Development Team