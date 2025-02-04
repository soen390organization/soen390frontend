import { Component } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { loadUser, UserState } from '../store/user';
import { AuthService } from '../services/auth.service';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { UserService } from '../services/user.service';
import { UserInterface } from '../interfaces/user.interface';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  user$: Observable<UserState> = this.store.pipe(select('user'));
  email: string = '';
  password: string = '';

  constructor(
    private store: Store<{ user: UserState }>,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.store.dispatch(loadUser());
  }

  handleUserTest() {
    // this.userService.updateOrCreateUser('yanny@laurel.com');
    const user: UserInterface = {
      firstName: 'Noura',
      lastName: 'Tabbara',
      email: 'tabby@gmail.com',
      password: 'fatberry'
    }
    this.userService.createUser(user).then((userData) => console.log(userData));
  }

  onLogin(event: Event) {
    event.preventDefault(); // Prevent form submission
    this.authService
      .login(this.email, this.password)
      .then((userCredential) => {
        console.log('Login successful:', userCredential);
        // Handle successful login (e.g., navigate to a different page)
      })
      .catch((error) => {
        console.error('Login failed:', error.message);
        // Handle login error (e.g., show an error message)
      });
  }

  onSignup(event: Event) {
    event.preventDefault(); // Prevent form submission
    this.authService
      .signup(this.email, this.password)
      .then((userCredential) => {
        console.log('Signup successful:', userCredential);
        // Handle successful signup (e.g., navigate or show success message)
      })
      .catch((error) => {
        console.error('Signup failed:', error.message);
        // Handle signup error (e.g., show an error message)
      });
  }
}
