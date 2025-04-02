/// <reference types="google.maps" />
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { EventType } from 'src/app/enums/event-type.enum';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { MappedinService } from '../mappedin/mappedin.service';

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

  events$: Observable<EventInfo[]> = this.selectedCalendar$.pipe(
    switchMap((calendarId) => {
      if (!calendarId) return of([]);
      return this.fetchEvents(calendarId);
    })
  );
  calendar$: Observable<any[]>;

  constructor(
    private readonly dataService: ConcordiaDataService,
    private readonly mappedInService: MappedinService
  ) {
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
      googleLoc: {
        title: event.summary,
        ...this.convertClassToAddress(event.location),
        type: 'outdoor'
      },
      mappedInLoc: {
        title: event.summary,
        address: this.convertClassToAddress(event.location).address,
        image: this.convertClassToAddress(event.location).image,
        indoorMapId: this.mappedInService.getMapId(),
        room: event.location,
        type: 'outdoor'
      }
    };
  }

  convertClassToAddress(classCode: string): {
    address: string;
    coordinates: google.maps.LatLng | null;
    image: string;
  } {
    const buildingCodeChars = this.cleanUpInput(classCode);

    const buildingCodeStr = this.getBuildingCode(buildingCodeChars);

    return this.buildLocationObject(buildingCodeStr);
  }

  /**
   * removes spaces and filters out invalid characters.
   */
  private cleanUpInput(classCode: string): string[] {
    return classCode
      .split('')
      .filter((char) => char.trim().length > 0)
      .filter((char) => /[a-z0-9]/i.test(char));
  }

  /**
   * clean array of characters.
   */
  private getBuildingCode(chars: string[]): string {
    let result = '';

    let i = 0;
    while (i < chars.length) {
      const char = chars[i].toUpperCase();

      if (/[1-9]/.test(char)) {
        break;
      }

      if (char === 'S' && i + 1 < chars.length && /[1-9]/.test(chars[i + 1])) {
        i++;
        continue;
      } else {
        result += char;
      }
      i++;
    }

    return result;
  }

  /**
   * use the extracted building code to look up the address,
   * coordinates, and image in one place.
   */
  private buildLocationObject(buildingCode: string): {
    address: string;
    coordinates: google.maps.LatLng | null;
    image: string;
  } {
    return {
      address: this.dataService.addressMap[buildingCode] ?? 'No Address',
      coordinates: this.dataService.coordinatesMap[buildingCode] ?? null,
      image: this.dataService.imageMap[buildingCode] ?? 'No Image'
    };
  }

  formatEventTime(start: Date, end: Date): string {
    const weekdayFormatter = new Intl.DateTimeFormat('en-CA', { weekday: 'short' });
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const day = weekdayFormatter.format(start).slice(0, 2);
    const startTime = timeFormatter.format(start);
    const endTime = timeFormatter.format(end);

    return `${day}, ${startTime} - ${endTime}`;
  }
  async setSelectedCalendar(calendarId: string) {
    this.selectedCalendarSubject.next(calendarId);
    await this.fetchEvents(calendarId).then((events) => (this.currentCalendarEvents = events));
  }

  getSelectedCalendar(): string | null {
    return this.selectedCalendarSubject.value;
  }
}
