// Run this script to clear all conversations from Firestore
// Instructions: 
// 1. Download your Firebase service account JSON from Firebase Console
// 2. Place it in the root directory as "serviceAccountKey.json"
// 3. Run: node clear-conversations.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'soulvoyage-78b27'
});

const db = admin.firestore();

async function clearAllConversations() {
  try {
    console.log('Starting to clear all conversations...');
    
    const conversationsRef = db.collection('conversations');
    const snapshot = await conversationsRef.get();
    
    console.log(`Found ${snapshot.docs.length} conversations to delete`);
    
    for (const conversationDoc of snapshot.docs) {
      console.log(`Deleting conversation: ${conversationDoc.id}`);
      
      // Delete all messages in this conversation
      const messagesRef = conversationDoc.ref.collection('messages');
      const messagesSnapshot = await messagesRef.get();
      
      console.log(`  - Found ${messagesSnapshot.docs.length} messages`);
      
      for (const messageDoc of messagesSnapshot.docs) {
        await messageDoc.ref.delete();
      }
      
      // Delete the conversation document
      await conversationDoc.ref.delete();
    }
    
    console.log('✅ All conversations cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing conversations:', error);
    process.exit(1);
  }
}

clearAllConversations();
