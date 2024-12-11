import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database'; // Import Realtime Database

const firebaseConfig = {
  apiKey: "Your Key",
  authDomain: "Your Auth Domain",
  databaseURL: "Database URL",
  projectId: "ID",
  storageBucket: "Storage",
  messagingSenderId: "Default",
  appId: "Default",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app); // Correctly initialize Realtime Database

export default app;
