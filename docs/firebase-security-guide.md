# 🔐 Firebase Security Setup Guide

## 🚨 IMPORTANT: Protecting Your Firebase Secrets

### Environment Variables Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your actual Firebase values:**
   ```bash
   # Get these from Firebase Console > Project Settings > General > Your apps
   VITE_FIREBASE_API_KEY=your_actual_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=domafocapp.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=domafocapp
   VITE_FIREBASE_STORAGE_BUCKET=domafocapp.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   ```

### Security Checklist

✅ **What's Protected:**
- All Firebase API keys are in `.env.local` (not committed to git)
- `.gitignore` includes all sensitive Firebase files
- Environment variables are validated at runtime
- Template file (`.env.example`) shows structure without real values

❌ **Never Commit These:**
- `.env.local` - Contains real API keys
- `firebase-debug.log` - May contain sensitive info
- `.firebase/` directory - Contains deployment tokens
- Any `firebase-adminsdk-*.json` files - Service account keys

### Getting Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ → **Project Settings**
4. Scroll to **Your apps** section
5. Click the web app icon
6. Copy the config values to your `.env.local` file

### Verifying Security

Run this to check your setup:
```bash
# Check that secrets are not in git
git status --ignored

# Verify environment variables are loaded
npm run dev
# Check browser console for Firebase initialization
```

### Production Deployment

For production deployment, set these environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables  
- Firebase Hosting: Use `firebase functions:config:set`

**Remember:** Environment variables in Vite must start with `VITE_` to be available in the browser.
