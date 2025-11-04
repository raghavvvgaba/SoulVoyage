# Firebase Authentication Setup Guide

This guide will help you set up Firebase authentication for SoulVoyage with Email/Password, Google, and Anonymous sign-in methods.

## Prerequisites
- Firebase account (create at https://firebase.google.com/)
- Google Cloud Console access

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "SoulVoyage" (or your preferred name)
4. Accept terms and create project
5. Wait for project to be created

## Step 2: Get Firebase Configuration

1. In Firebase Console, click the gear icon (⚙️) and select "Project settings"
2. Scroll down to "Your apps" section
3. Click the Web icon (</>) to add a new app
4. Follow the setup wizard and register the app
5. Copy the Firebase config object with these keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

## Step 3: Configure Authentication Methods

### Enable Email/Password Sign-in
1. Go to **Authentication** → **Sign-in method**
2. Click **Email/Password**
3. Enable both "Email/Password" and "Email link (passwordless sign-in)" if desired
4. Click **Save**

### Enable Google Sign-in
1. In **Sign-in method**, click **Google**
2. Enable it
3. Set "Project name" and "Project support email"
4. Click **Save**

### Enable Anonymous Sign-in
1. In **Sign-in method**, scroll down and click **Anonymous**
2. Enable it
3. Click **Save**

## Step 4: Add Firebase Credentials to Your Project

1. Open the `.env` file in your project root
2. Fill in the values you copied from Firebase:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Step 5: Test Authentication

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:8081/login-auth` to test the new Firebase authentication

3. Test all three methods:
   - Sign in with Email/Password
   - Sign in with Google
   - Continue Anonymously

## Using Authentication in Your App

### Get Current User

```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user && <p>Welcome, {user.email || 'Anonymous User'}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes (Optional)

You can create a ProtectedRoute component to restrict access to authenticated users only.

## Security Rules (Optional)

To secure your data in Firestore or Realtime Database, update the security rules in Firebase Console.

Example Firestore rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Issue: "auth/invalid-api-key"
- Ensure you've correctly copied the API key from Firebase Console
- Check that `.env` file has the correct variables

### Issue: "auth/operation-not-allowed"
- Verify that the authentication method is enabled in Firebase Console
- Check Sign-in method settings

### Issue: "Google sign-in not working"
- Ensure Google authentication is enabled in Firebase Console
- Make sure your domain is added to authorized redirect URIs

### Issue: Environment variables not loading
- Restart your development server after updating `.env`
- Make sure variable names start with `REACT_APP_`

## Available Routes

- `/login-auth` - Firebase Email/Password and Google Sign-in
- `/signup-auth` - Firebase Create Account and Anonymous Sign-in
- `/main` - Main application (requires authentication)

## Next Steps

1. Add more user profile information (store in Firestore)
2. Implement persistent user sessions
3. Add email verification
4. Set up password reset functionality
5. Add user profile pictures
