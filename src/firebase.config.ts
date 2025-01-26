import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJyr5jKYT8ZZjnL9Dww1eMSq6WmS1IbvE",
  authDomain: "soen390-aab1a.firebaseapp.com",
  projectId: "soen390-aab1a",
  storageBucket: "soen390-aab1a.firebasestorage.app",
  messagingSenderId: "470177451529",
  appId: "1:470177451529:web:46ce8aee50a324fc8c32d8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export individual Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);
