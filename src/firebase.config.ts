import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { environment } from '../src/environments/environment';

// Your web app's Firebase configuration
const firebaseConfig = environment.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export individual Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);

// Attach Firebase to window for Cypress testing
if (typeof window !== 'undefined') {
    (window as any).firebaseApp = app;
    (window as any).firebaseAuth = auth;
    (window as any).firebaseDB = db;
  }