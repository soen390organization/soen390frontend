import { Injectable } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() { }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
}
