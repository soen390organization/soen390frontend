/// <reference types="google.maps" />
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Location } from 'src/app/interfaces/location.interface';
import data from 'src/assets/concordia-data.json';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { EventType } from 'src/app/enums/event-type.enum';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly auth = getAuth();
  private readonly googleProvider = new GoogleAuthProvider();
  private accessToken: string | null = null;
  private previouslyFetchedEvents: {
    [calendarId: string]: any[];
  } = {};
  currentCalendarEvents: any[];

  private readonly calendarsSubject = new BehaviorSubject<any[]>([]);
  calendars$ = this.calendarsSubject.asObservable();

  public selectedCalendarSubject = new BehaviorSubject<string | null>(null);
  selectedCalendar$ = this.selectedCalendarSubject.asObservable();

  events$: Observable<Location[]> = this.selectedCalendar$.pipe(
    switchMap((calendarId) => {
      if (!calendarId) return of([]);
      return this.fetchEvents(calendarId);
    })
  );

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

      if (!credential?.accessToken) {
        throw new Error('No credential or access token found');
      }

      this.accessToken = credential.accessToken;
      const calendars = await this.getUserCalendars();
      this.calendarsSubject.next(calendars);
      this.setSelectedCalendar(calendars[0].id);
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
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
      const timeMax = endOfWeek.toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${now}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
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

      const locationItems = data.items.map((event) => this.transformEvent(event));
      this.previouslyFetchedEvents[calendarId] = locationItems;
      console.log(locationItems);
      return locationItems || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  transformEvent(event: any): EventInfo {
    const eventType = event.summary.split(' ')[1] || 'LEC';
    return {
      title: event.summary,
      type: EventType[eventType.toUpperCase()],
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
      location: {
        title: event.summary,
        ...this.convertClassToAddress(event.location)
      },
      room: event.location
    };
  }

  convertClassToAddress(classCode: string): { address: string; coordinates: google.maps.LatLng } {
    const buildingcode = classCode.split(' ')[0];

    let googleMapLocation = {
      address: 'No Address',
      coordinates: null
    };

    data.sgw.buildings.forEach((building) => {
      if (building.abbreviation === buildingcode) {
        googleMapLocation['address'] = building.address;
        googleMapLocation['coordinates'] = building.coordinates;
      }
    });
    data.loy.buildings.forEach((building) => {
      if (building.abbreviation === buildingcode) {
        googleMapLocation['address'] = building.address;
        googleMapLocation['coordinates'] = building.coordinates;
      }
    });

    return googleMapLocation;
  }

  formatEventTime(startDateTime: string, endDateTime: string): string {
    const daysMap: { [key: string]: string } = {
      Monday: 'Mo',
      Tuesday: 'Tu',
      Wednesday: 'We',
      Thursday: 'Th',
      Friday: 'Fr',
      Saturday: 'Sa',
      Sunday: 'Su'
    };

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    const dayAbbr = daysMap[startDate.toLocaleDateString('en-US', { weekday: 'long' })];
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return `${dayAbbr} ${startTime}-${endTime}`;
  }

  async setSelectedCalendar(calendarId: string) {
    this.selectedCalendarSubject.next(calendarId);
    await this.fetchEvents(calendarId).then((events) => (this.currentCalendarEvents = events));
  }

  getSelectedCalendar(): string | null {
    return this.selectedCalendarSubject.value;
  }
}
