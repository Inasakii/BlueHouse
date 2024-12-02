// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // apiKey: your key
  // authDomain: "your domain",
  // databaseURL: "your url",
  // projectId: "your project ID",
  // storageBucket: "your storageBucket",
  // messagingSenderId: "your MessengerID",
  // appId: "your App ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export individual Firebase services
export const auth = getAuth(app);

export default app;
