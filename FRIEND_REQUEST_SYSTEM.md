# Friend Request System - Implementation Guide

## What's New

A complete friend request system has been implemented with Firestore as the backend:

### **Flow:**

1. **User A sends friend request**
   - User A clicks "Add Friend"
   - Enters User B's ID
   - Request is saved to Firestore `friendRequests` collection
   - User A sees success message

2. **User B receives request**
   - Friend request appears in "Friend Requests" badge
   - Shown with User A's name and accept/reject buttons
   - Real-time updates via Firestore listener

3. **User B accepts request**
   - User A is added to User B's friends list
   - Request status updated to "accepted" in Firestore
   - Request removed from pending list

4. **User B rejects request**
   - Request is deleted from Firestore
   - Request removed from pending list
   - User A remains unaware (clean rejection)

### **Firestore Collections:**

```
friendRequests/{requestId}
├── fromUserId: string (who sent the request)
├── fromUserName: string
├── toUserId: string (who receives the request)
├── toUserName: string
├── status: string ("pending" | "accepted" | "rejected")
└── createdAt: timestamp

users/{userId}
├── id: string (unique user ID)
├── name: string
├── email: string
├── userId: string
└── createdAt: timestamp
```

## How to Test

### **Test Scenario:**

1. **Create User A:**
   - Sign up with email: `usera@test.com`
   - Confirm User A gets a unique ID (e.g., `1730881234-ABC123`)

2. **Create User B:**
   - Sign up with email: `userb@test.com`
   - Get User B's unique ID

3. **User A sends friend request to User B:**
   - Go to Edit Profile (optional - just to see the ID)
   - Click "Add Friend"
   - Paste User B's ID
   - Click "Add Friend"
   - Should see: "Friend Request Sent to [User B Name]"

4. **Switch to User B profile:**
   - Use "Change Profiles" menu
   - You'll see a badge showing number of pending requests
   - Click "Friends" to see the request
   - Should show User A with "Accept" and "Decline" buttons

5. **User B accepts the request:**
   - Click "Accept"
   - Should see: "User A has been added to your friends"
   - User A now appears in Direct Messages at the top

6. **Open Direct Message:**
   - Click on User A in the Direct Messages list
   - You can now chat!

## Key Features

✅ **Real-time Updates**
- Friend requests appear instantly when sent
- Badge count updates automatically
- Powered by Firestore listeners

✅ **Request Management**
- Accept requests to become friends
- Reject to decline without adding
- Requests stored with timestamps

✅ **User Lookup**
- Search by User ID (case-insensitive, auto-uppercase)
- Prevents duplicate requests
- Can't add yourself

✅ **Persistent Storage**
- All requests stored in Firestore
- Works across devices
- History maintained

## Error Handling

- "User ID not found" - User doesn't exist
- "This user is already your friend" - Duplicate prevention
- "You cannot add yourself" - Self-add prevention
- "No profile selected" - Not logged in

## Files Modified

1. **SignupAuth.tsx** - Saves user to Firestore on signup
2. **MainPage.tsx** - Manages friend requests and adds friends
3. **FIRESTORE_RULES.md** - Updated security rules for friendRequests

## Next Steps (Optional Enhancements)

- Add mutual friend status checking
- Show "pending" vs "accepted" requests separately
- Add sent requests view (requests you've sent)
- Add friend suggestions based on common interests
- Add cancel sent request feature
