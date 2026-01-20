import Config from 'react-native-config';

export const FIREBASE_CONFIG = {
  // apiKey: 'AIzaSyDE46dIYncQ2_6OYSQaBr7Vr9kI6Og4w5A',
  // authDomain: 'senior-stylist-t.firebaseapp.com',
  // projectId: 'senior-stylist-t',
  // storageBucket: 'senior-stylist-t.firebasestorage.app',
  // messagingSenderId: '128763626215',
  // appId: '1:128763626215:android:424161602d3249b99f5842',

  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
};

export type FirebaseConfig = typeof FIREBASE_CONFIG;
