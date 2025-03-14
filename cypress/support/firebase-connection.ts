import { initializeApp } from 'firebase/app';
import { environment } from 'src/environments/environment'; // Adjust the path as needed

Cypress.Commands.add('checkFirebaseConnection', () => {
  return new Promise((resolve, reject) => {
    try {
      const app = initializeApp(environment.firebaseConfig);
      if (app) {
        resolve(true);
      } else {
        reject(new Error('Firebase failed to initialize'));
      }
    } catch (error) {
      reject(new Error('Firebase connection failed: ' + error.message));
    }
  });
});
