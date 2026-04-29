// Firebase Configuration
// Replace these values with your Firebase project settings.
// Found at: Firebase Console > Project Settings > Your Apps > SDK setup and configuration

const FIREBASE_CONFIG = {
  apiKey:      'YOUR_API_KEY',
  authDomain:  'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId:   'YOUR_PROJECT_ID',
};

// Slack notifications are handled server-side via /api/notify (Vercel function)
// Set SLACK_WEBHOOK_URL in Vercel environment variables — never put it here
