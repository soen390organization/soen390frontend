import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';
import { ref, get } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db as database } from '../../firebase.config';
import { UserInterface } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private readonly apiService: ApiService) {}

  public async createUser(user: UserInterface): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);

      const userId = userCredential.user.uid;
      const userData = { ...user, id: userId };
      await this.apiService.updateOrCreate('users', userData);

      console.log('User created and saved in the database:', userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  public async updateUser(user: UserInterface) {
    await this.apiService.updateOrCreate('users', user);
  }

  public async signIn(email: string, password: string): Promise<UserInterface | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        console.log('User retrieved from the database:', userData);
        return userData as UserInterface;
      } else {
        console.error('User not found in the database.');
        return null;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  public getUser(): Observable<{ id: string; name: string; email: string }> {
    // Mock API call
    return of({ id: '1', name: 'Laurel', email: 'laurel@example.com' });
  }
}
