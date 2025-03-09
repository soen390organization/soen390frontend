import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private auth = getAuth();
  private googleProvider = new GoogleAuthProvider();

  private calendarsSubject = new BehaviorSubject<any[]>([]);
  calendars$ = this.calendarsSubject.asObservable();

  private selectedCalendarSubject = new BehaviorSubject<string | null>(null);
  selectedCalendar$ = this.selectedCalendarSubject.asObservable();

  constructor() {
    this.googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  }

  /**
   * Initiates Google Sign-In and fetches calendars.
   */
  async signInWithGoogle(): Promise<boolean> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential || !credential.accessToken) {
        throw new Error('No credential or access token found');
      }

      const accessToken = credential.accessToken;
      const calendars = await this.getUserCalendars(accessToken);
      this.calendarsSubject.next(calendars); // Store the list of calendars
      console.log(calendars)
      return true;
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      return false;
    }
  }

  /**
   * Fetches the user's Google Calendars.
   */
  async getUserCalendars(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendars:', error);
      return [];
    }
  }

  setSelectedCalendar(calendarId: string) {
    this.selectedCalendarSubject.next(calendarId);
  }

  getSelectedCalendar(): string | null {
    return this.selectedCalendarSubject.value;
  }
}
