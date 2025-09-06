# 🔥 Firebase Setup Instructions

## Step 1: Get Your Firebase Configuration

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your `domafocapp` project
3. Click the gear icon (⚙️) → **Project Settings**
4. In the **General** tab, scroll down to **Your apps**
5. Click **Add app** → **Web** (</>) if you haven't already
6. Register your app with nickname: `DomaFocApp`
7. Copy the `firebaseConfig` object

## Step 2: Update Firebase Configuration

Replace the placeholder values in `src/lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key-here",
  authDomain: "domafocapp.firebaseapp.com",
  projectId: "domafocapp",
  storageBucket: "domafocapp.firebasestorage.app",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
};
```

## Step 3: Firestore Security Rules

1. Go to **Firestore Database** in your Firebase Console
2. Click **Rules** tab
3. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all tournament documents
    // In production, you'll want to add authentication
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Note**: These rules allow public access. For production, implement proper authentication.

## Step 4: Test the Migration

1. Make sure you have some tournaments in localStorage (create a few test tournaments if needed)
2. Update the Firebase config with your real values
3. Start the dev server: `npm run dev`
4. Open the app - it should automatically migrate your local tournaments to Firestore
5. You should see "☁️ Cloud Sync Active" badge in the header

## Step 5: Verify in Firebase Console

1. Go to **Firestore Database** in your Firebase Console
2. You should see these collections:
   - `tournaments` - Your tournament data
   - `teams` - Team information
   - `players` - Player details
   - `matches` - Match results
   - `goals` - Individual goals

## Troubleshooting

### "📱 Offline Mode" Badge Shows

- Check your Firebase config values
- Verify internet connection
- Check browser console for errors
- Ensure Firestore is enabled in Firebase Console

### Migration Doesn't Start

- Open browser dev tools (F12)
- Check if there are tournaments in localStorage: `localStorage.getItem('tournaments')`
- Look for migration logs in console

### Firestore Permission Errors

- Check your Firestore security rules
- Make sure rules allow read/write access
- Verify your project ID matches

## Production Security (Future)

For production deployment, implement these security measures:

1. **Authentication**: Add Firebase Auth
2. **Security Rules**: Restrict access based on user authentication
3. **API Keys**: Restrict API key usage to your domain
4. **Environment Variables**: Store config in environment variables

Example production security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tournaments/{tournamentId} {
      allow read, write: if request.auth != null;
    }
    match /teams/{teamId} {
      allow read, write: if request.auth != null;
    }
    // ... other collections
  }
}
```

---

Once you've updated the Firebase config, your app will automatically use Firestore for data persistence with real-time sync across devices! 🚀
