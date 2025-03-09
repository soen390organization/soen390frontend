import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
  standalone: false
})

export class UserInfoPage implements OnInit {
  auth = getAuth();
  googleProvider = new GoogleAuthProvider();

  constructor(private router: Router) { }

  ngOnInit() {
  }

  openHomePage() {
    this.router.navigate(['home']);
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      console.log('Google Sign-In Result:', result);
      // Handle user data
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
    }
  }

}
