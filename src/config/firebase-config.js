// Firebase Configuration
// Firebase Console > Project Settings > Your Apps > SDK setup and configuration

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAGcdGtIz-Crg90lXGVU1d1o6lT1h-fgQ4',
  authDomain:        'kw-calendar-495a8.firebaseapp.com',
  projectId:         'kw-calendar-495a8',
  storageBucket:     'kw-calendar-495a8.firebasestorage.app',
  messagingSenderId: '675841839150',
  appId:             '1:675841839150:web:7f6032b55f3af6362b0fbf',
  measurementId:     'G-Z1R3B8SLVC'
};

// Slack notifications are handled server-side via /api/notify (Vercel function)
// Set SLACK_WEBHOOK_URL in Vercel environment variables — never put it here
