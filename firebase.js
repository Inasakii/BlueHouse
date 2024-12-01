// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA6FTeusQo-DoinnxjhfXpNqVKGlAvsw9M",
  authDomain: "try-led-9d876.firebaseapp.com",
  databaseURL: "https://try-led-9d876-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "try-led-9d876",
  storageBucket: "try-led-9d876.appspot.com",
  messagingSenderId: "824598666827",
  appId: "1:824598666827:web:5fc6a09d039fc6857077ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export individual Firebase services
export const auth = getAuth(app);

export default app;
