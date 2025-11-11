# 🔓 Temporary Firestore Rules for Database Deletion

## ⚠️ Problem
The error "Missing or insufficient permissions" means your Firestore security rules don't allow deletion of documents.

---

## 🔧 Solution: Temporarily Open Rules

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project: **SoulVoyage**
3. Navigate to: **Firestore Database** → **Rules** tab

---

### Step 2: Replace with These TEMPORARY Rules

Copy and paste these rules (they allow deletion for clearing the database):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all operations for database cleanup
    match /{document=**} {
      allow read, write, delete: if true;
    }
  }
}
```

### Step 3: Click "Publish"

---

### Step 4: Clear Your Database
1. Go back to: `http://localhost:8080/clear-database`
2. Type: `DELETE EVERYTHING`
3. Click: Delete All Data
4. ✅ Should work now!

---

### Step 5: RESTORE SECURE RULES (IMPORTANT!)

After clearing the database, **immediately** replace with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone can read profiles (for friend search)
      allow read: if true;
      // Only the user can write their own profile
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Friends subcollection
      match /friends/{friendId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Friend requests
    match /friendRequests/{requestId} {
      allow read: if request.auth != null && (
        resource.data.fromUserId == request.auth.uid ||
        resource.data.toUserId == request.auth.uid
      );
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.toUserId == request.auth.uid
      );
      allow delete: if request.auth != null;
    }
    
    // Servers
    match /servers/{serverId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.owner == request.auth.uid;
      
      // Server members
      match /members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      
      // Messages
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

Click **"Publish"** again.

---

## 📋 Quick Checklist

- [ ] Open Firebase Console → Firestore → Rules
- [ ] Copy temporary open rules (allow all)
- [ ] Click "Publish"
- [ ] Go to clear-database page
- [ ] Delete everything
- [ ] **IMMEDIATELY** restore secure rules
- [ ] Click "Publish" again
- [ ] Done! ✅

---

## ⚠️ IMPORTANT SECURITY WARNING

**Never leave the temporary open rules in production!**

The temporary rules (`allow read, write, delete: if true`) allow **anyone** to do **anything** with your database. This is:
- ✅ Safe for development/testing
- ✅ Safe for a few minutes to clear data
- ❌ **DANGEROUS** for production
- ❌ **DANGEROUS** if left permanently

**Always restore the secure rules immediately after clearing the database!**

---

## 🔐 What the Secure Rules Do

### Users:
- ✅ Anyone can **read** profiles (for friend search)
- ✅ Users can only **write** their own profile
- ✅ Users can only manage their own friends list

### Friend Requests:
- ✅ Can only read requests sent to/from you
- ✅ Anyone authenticated can create requests
- ✅ Receivers can accept/reject requests

### Servers:
- ✅ All authenticated users can read servers
- ✅ Authenticated users can create servers
- ✅ Only owners can delete servers
- ✅ Members can be managed by authenticated users

### Conversations/Messages:
- ✅ All authenticated users can read/write
- ✅ Messages can be created and updated
- ✅ Deletion is allowed (for clear functionality)

---

## 🎯 Alternative: Manual Deletion in Firebase Console

If you prefer not to change rules, you can manually delete in Firebase Console:

1. Go to **Firestore Database** → **Data** tab
2. Click on each collection (`users`, `conversations`, `servers`, etc.)
3. Click the three dots (⋮) next to collection name
4. Click **"Delete collection"**
5. Confirm deletion
6. Repeat for all collections

This is slower but doesn't require changing rules.

---

## ✅ After Fresh Start

Once you've cleared the database and restored secure rules:
1. Sign up with a new account
2. Everything will work with correct Firebase Auth UIDs
3. No localStorage issues
4. Conversations will work properly
5. Security rules protect your data

---

**Status**: Ready to clear database
**Security**: Temporarily open, then restore secure rules
**Time needed**: 5 minutes total
