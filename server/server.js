import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

// Initialize Firebase Admin (use your Firebase credentials)
try {
  const serviceAccountPath = path.join(__dirname, 'firebase-credentials.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    console.warn('Firebase credentials file not found. Some features may not work.');
  }
} catch (error) {
  console.warn('Firebase initialization warning:', error.message);
}

const db = admin.firestore();

// Express app for health checks
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SoulVoyage WebSocket server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

// Store active connections
const connections = new Map(); // conversationId -> Set of ws clients

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      // Store message in Firestore
      if (message.conversationId) {
        const messagesCollection = db.collection('conversations').doc(message.conversationId).collection('messages');
        
        const messageData = {
          id: message.id,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
          conversationId: message.conversationId,
          createdAt: new Date(),
        };

        // Add to Firestore
        await messagesCollection.doc(message.id).set(messageData);

        // Broadcast to all clients in this conversation
        if (connections.has(message.conversationId)) {
          const clients = connections.get(message.conversationId);
          clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN = 1
              client.send(JSON.stringify(messageData));
            }
          });
        }

        console.log(`Message saved from ${message.senderName}: ${message.content}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    // Remove client from all conversations
    connections.forEach((clients, conversationId) => {
      clients.delete(ws);
      if (clients.size === 0) {
        connections.delete(conversationId);
      }
    });
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
