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

  constructor(private router: Router) { 
    this.googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");
  }

  ngOnInit() {
  }

  openHomePage() {
    this.router.navigate(['home']);
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      console.log('Google Sign-In Result:', result);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential) {
        throw new Error('No credential found');
      }

      const accessToken = credential.accessToken;
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Fetch user's Google Calendars
      const calendars = await this.getUserCalendars(accessToken);
      console.log('User\'s Google Calendars:', calendars);
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
    }
  }

  private async getUserCalendars(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Google Calendars:', error);
      return null;
    }
  }
}
