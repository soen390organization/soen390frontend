import { Injectable } from '@angular/core';
import { CalendarEvent } from '../../interfaces/event.interface';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly auth = getAuth();
  private readonly googleProvider = new GoogleAuthProvider();
  private calendarServiceReady = new BehaviorSubject<boolean>(true);
  private selectedCalendarId = null;
  private accessToken: string | null = null;
  private previouslyFetchedEvents: {
    [calendarId: string]: any[];
  } = {};
  private events: CalendarEvent[] = [];

  private readonly calendarsSubject = new BehaviorSubject<any[]>([]);
  calendars$ = this.calendarsSubject.asObservable();

  public selectedCalendarSubject = new BehaviorSubject<string | null>(null);
  selectedCalendar$ = this.selectedCalendarSubject.asObservable();

  events$: Observable<any[]> = this.selectedCalendar$.pipe(
    switchMap((calendarId) => {
      if (!calendarId) return of([]);
      return this.fetchEvents(calendarId);
    })
  );

  constructor() {
    this.googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  }

  /**
   * Returns an observable that emits the readiness status of the CalendarService (which is always technically ready even with an empty or lack of calendar).
   * @returns An observable emitting a boolean indicating that the CalendarService is ready.
   */
  public isInitialized() {
    return this.calendarServiceReady.asObservable();
  }

  /**
   * Initiates Google Sign-In and fetches calendars.
   */
  async signInWithGoogle(): Promise<boolean> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('No credential or access token found');
      }

      this.accessToken = credential.accessToken;
      const calendars = await this.getUserCalendars();
      this.calendarsSubject.next(calendars);
      this.setSelectedCalendarId(calendars[0].id);
      this.setSelectedCalendar(calendars[0].id);
      await this.fetchEvents(this.selectedCalendarId);
      return true;
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      return false;
    }
  }

  /**
   * Fetches the user's Google Calendars.
   */
  async getUserCalendars(): Promise<any[]> {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json'
        }
      });

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

  async fetchEvents(calendarId: string): Promise<any[]> {
    try {
      if (calendarId in this.previouslyFetchedEvents) {
        return this.previouslyFetchedEvents[calendarId];
      }
      const now = new Date().toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${now}&singleEvents=true&orderBy=startTime`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();

      this.previouslyFetchedEvents[calendarId] = data.items;
      console.log(data.items);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  async setSelectedCalendar(calendarId: string) {
    this.selectedCalendarId = calendarId;
    this.selectedCalendarSubject.next(calendarId);
    await this.fetchEvents(calendarId).then(() => this.updateEventArray());
  }

  setSelectedCalendarId(calendarId: string) {
    this.selectedCalendarId = calendarId;
  }

  getSelectedCalendar(): string | null {
    return this.selectedCalendarSubject.value;
  }

  getEvents(): CalendarEvent[] {
    return this.events;
  }

  async getEventsPromise(): Promise<CalendarEvent[]> {
    return this.events.map((event) => ({
      name: event.name,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      description: event.description
    }));
  }

  updateEventArray() {
    this.events = [];
    var i = 0;
    this.previouslyFetchedEvents[this.selectedCalendarId].forEach((currentEvent) => {
      var newEvent: CalendarEvent = {
          name: currentEvent.summary,
          start_datetime: currentEvent.start.dateTime,
          end_datetime: currentEvent.end.dateTime,
          description: currentEvent.description
      };
      this.events[i] = newEvent;
      i++;
    });
    console.log(this.events);
  }
}
