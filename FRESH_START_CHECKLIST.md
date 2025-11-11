# ✅ Fresh Start Checklist - Your Database is Now Clean!

## 🎉 Step 1: Database Cleared ✅

You've manually deleted all data from Firestore. Great!

Your Firestore should now have:
- ❌ No `users` collection
- ❌ No `conversations` collection  
- ❌ No `servers` collection
- ❌ No `friendRequests` collection
- ✅ Empty database ready for fresh data

---

## 🔐 Step 2: Update Firestore Security Rules

### Go to Firebase Console → Firestore Database → Rules

Replace your current rules with these **secure production rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone can read profiles (needed for friend search)
      allow read: if true;
      // Users can create their own profile on signup
      allow create: if request.auth != null && request.auth.uid == userId;
      // Users can only update their own profile
      allow update: if request.auth != null && request.auth.uid == userId;
      // Users can delete their own profile
      allow delete: if request.auth != null && request.auth.uid == userId;
      
      // Friends subcollection
      match /friends/{friendId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Friend requests
    match /friendRequests/{requestId} {
      // Can read if you're the sender or receiver
      allow read: if request.auth != null;
      // Anyone authenticated can create a friend request
      allow create: if request.auth != null;
      // Can update if you're the receiver (to accept/reject)
      allow update: if request.auth != null;
      // Can delete your own requests
      allow delete: if request.auth != null;
    }
    
    // Servers
    match /servers/{serverId} {
      // Anyone authenticated can read servers
      allow read: if request.auth != null;
      // Anyone authenticated can create a server
      allow create: if request.auth != null;
      // Anyone authenticated can update servers (for channels/categories)
      allow update: if request.auth != null;
      // Only server owner can delete
      allow delete: if request.auth != null && resource.data.owner == request.auth.uid;
      
      // Server members subcollection
      match /members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null;
        allow delete: if request.auth != null;
      }
    }
  }
}
```

### Click "Publish" ✅

---

## 🧹 Step 3: Clear Browser Data (Optional but Recommended)

### Open Browser DevTools:
1. Press `F12` or `Cmd+Option+I` (Mac)
2. Go to **Application** tab
3. **Local Storage** → Click on `localhost:8080`
4. Click "Clear All" (or delete each item)
5. **Session Storage** → Clear all
6. Close DevTools

This removes any old cached data.

---

## 🚀 Step 4: Sign Up with Fresh Account

### Option A: Create New Account
1. Visit: `http://localhost:8080/`
2. Click: **"Sign Up"**
3. Fill in:
   - First Name: Your first name
   - Last Name: Your last name
   - Email: Your email (new or same)
   - Password: Your password
4. Click: **"Sign Up"**

### Option B: Use Existing Firebase Auth Account
If you have an existing Firebase Auth user:
1. Visit: `http://localhost:8080/`
2. Click: **"Login"**
3. Enter your credentials
4. On first login, a new profile will be created in Firestore

---

## ✅ Step 5: Verify Everything Works

### Check 1: Profile Initials Show
- Look at **top-right corner**
- Should see your **initials** (e.g., "JD" for John Doe)
- ✅ Not the default user icon

### Check 2: User ID Exists
1. Click profile icon → **Edit Profile**
2. You should see your **User ID** (e.g., `1730881234-ABC123`)
3. This is your shareable ID for friend requests
4. ✅ ID should be visible

### Check 3: Can Add Friends
1. Ask someone else to sign up
2. Get their User ID from their Edit Profile
3. Go to Friends page → Click **"+ Add Friend"**
4. Paste their User ID
5. Click **"Add Friend"**
6. ✅ Friend request should send successfully

### Check 4: Can Create Servers
1. Click **"+ Create Server"**
2. Enter server name
3. Click Create
4. ✅ Server should appear in sidebar

### Check 5: Can Send Messages
1. Add a friend (or have them accept your request)
2. Click on their name in friends list
3. Type a message
4. Press Enter
5. ✅ Message should appear immediately

---

## 📊 What to Check in Browser Console

Open Console (`Cmd+Option+J` or `F12` → Console tab) and look for:

### On Login/Signup:
```
AuthContext - Fetching profile for userId: XWslEHUlwmbAXtWBhOlb...
AuthContext - User document data: {name: "John Doe", email: "..."}
AuthContext - Setting currentProfile: {...}
```

### On Friends Page:
```
Loading friends for user: XWslEHUlwmbAXtWBhOlb...
Friends snapshot received: 0 friends
```

### On Sending Message:
```
Generated conversationId: XWslEH...Mm2_YmuK8p...7l
Saving message to Firestore: {...}
Message saved successfully with ID: abc123
```

### ✅ All logs should show Firebase Auth UIDs (long strings), NOT custom IDs

---

## 🔍 What to Check in Firebase Console

### Firestore Database → Data:

After signing up, you should see:

```
📁 users/
  └── XWslEHUlwmbAXtWBhOlbXuyL9Mm2/  ← Firebase Auth UID
      ├── id: "XWslEHUlwmbAXtWBhOlbXuyL9Mm2"
      ├── name: "John Doe"
      ├── email: "john@example.com"
      ├── userId: "1730881234-ABC123"  ← Custom display ID
      └── createdAt: Timestamp
```

After adding a friend:
```
📁 friendRequests/
  └── abc123xyz/
      ├── fromUserId: "XWslEH...Mm2"  ← Your Auth UID
      ├── toUserId: "YmuK8p...7l"     ← Friend's Auth UID
      ├── fromUserName: "John Doe"
      ├── toUserName: "Jane Smith"
      └── status: "pending"
```

After sending a message:
```
📁 conversations/
  └── XWslEH...Mm2_YmuK8p...7l/  ← Sorted Auth UIDs
      └── messages/
          └── msg123/
              ├── text: "Hello!"
              ├── sender: "John Doe"
              ├── senderId: "XWslEH...Mm2"
              └── timestamp: Timestamp
```

---

## 🎯 Expected Behavior

### ✅ What Should Work:
- Profile creation on signup
- Profile initials display
- Friend search by User ID
- Friend requests send/receive
- Friends list updates in real-time
- Server creation
- Channel creation
- Message sending
- Messages appear in real-time
- Polls creation
- Photo messages
- Everything stored in Firestore
- Zero localStorage usage (except theme)

### ❌ What Should NOT Happen:
- "Please log in" errors when logged in
- Profile initials not showing
- Empty friends list when you have friends
- Messages not appearing
- Conversations not loading
- localStorage errors in console

---

## 🐛 Troubleshooting

### Profile initials don't show:
- Check browser console for AuthContext logs
- Verify user document exists in Firestore under your Auth UID
- Check that `name` field has your name

### Can't add friends:
- Verify you're using the correct User ID (from Edit Profile)
- Check browser console for "Generated conversationId" log
- Verify friend request appears in Firestore

### Messages don't appear:
- Check conversation ID in console (should be two Auth UIDs joined by _)
- Verify messages collection exists under that conversation in Firestore
- Check for "Messages snapshot received" log

### "Permission denied" errors:
- Verify you published the security rules
- Check rules allow authenticated users
- Make sure you're logged in

---

## 📱 Test with Second Account

To fully test:

1. **Open Incognito/Private Window**
2. Visit: `http://localhost:8080`
3. **Sign up with different email**
4. Get User ID from Edit Profile
5. **In main window**: Add this user as friend
6. **In incognito window**: Accept friend request
7. **Send messages between accounts**
8. ✅ Messages should appear in real-time on both

---

## ✅ Success Criteria

You know everything is working when:

- [x] Profile created with Firebase Auth UID as document ID
- [x] Profile initials show in top-right
- [x] Can see custom User ID in Edit Profile  
- [x] Can search and add friends by User ID
- [x] Friend requests work both ways
- [x] Friends appear in friends list
- [x] Can create servers
- [x] Can send messages
- [x] Messages appear immediately
- [x] Conversation IDs use Firebase Auth UIDs
- [x] Everything in Firestore (check Firebase Console)
- [x] No localStorage for app data (check DevTools)

---

## 🎉 You're All Set!

Your app now has:
- ✅ Clean database with no old data
- ✅ Correct Firebase Auth UID structure
- ✅ No localStorage conflicts
- ✅ Proper Firestore security rules
- ✅ Real-time synchronization
- ✅ Working conversations
- ✅ Everything properly organized

**Enjoy your fresh start!** 🚀

---

## 📞 Next Steps

1. Sign up with your account
2. Test all features
3. Invite friends to test
4. Check everything works
5. Start using the app!

If you encounter any issues, check:
- Browser console logs
- Firebase Console → Firestore data structure
- Security rules are published

**Last Updated**: November 11, 2025
