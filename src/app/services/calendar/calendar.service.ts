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

  constructor(
    private dataService: ConcordiaDataService,
    private mappedInService: MappedinService
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
        ...this.convertClassToAddress(event.location).coordinates
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
    coordinates: GoogleMapLocation;
    image: string;
  } {
    var buildingCodeChars = classCode.split('').filter((char) => char !== ' ');
    buildingCodeChars = buildingCodeChars.filter((char) => /[a-z0-9]/i.test(char));
    var currentStringPos = 0;
    var buildingCodeStr = '';
    var isNumReached = false;
    var handleables = [];
    while (!isNumReached && currentStringPos < 2) {
      if (
        parseInt(buildingCodeChars[currentStringPos]) >= 1 &&
        parseInt(buildingCodeChars[currentStringPos]) <= 9
      ) {
        isNumReached = true;
      } else {
        if (currentStringPos < buildingCodeChars.length - 1) {
          if (
            ((buildingCodeChars[currentStringPos] === 'S' ||
              buildingCodeChars[currentStringPos] === 's') &&
              buildingCodeChars[currentStringPos + 1] >= '1' &&
              buildingCodeChars[currentStringPos + 1] <= '9') === true
          ) {
            if (currentStringPos === 0) {
              handleables.push(buildingCodeChars[currentStringPos].toString().toUpperCase());
            } else {
              handleables.push(
                buildingCodeChars[currentStringPos - 1].toString().toUpperCase() +
                  buildingCodeChars[currentStringPos].toString().toUpperCase()
              );
            }
            currentStringPos++;
          } else {
            buildingCodeStr = buildingCodeStr.concat(
              buildingCodeChars[currentStringPos].toString().toUpperCase()
            );
            currentStringPos++;
          }
        }
      }
    }
    if (buildingCodeStr !== '') {
      handleables.push(buildingCodeStr.toString().toUpperCase());
    }

    let googleMapLocation = {
      address: 'No Address',
      coordinates: null,
      image: 'No Image'
    };
    var keys = this.dataService.addressMap.keys; //All maps have the same keys.
    const keyIterator = keys[Symbol.iterator]();
    for (let key of keyIterator) {
      if (buildingCodeStr == key) {
        googleMapLocation['address'] = this.dataService.addressMap[buildingCodeStr];
        googleMapLocation['coordinates'] = this.dataService.coordinatesMap[buildingCodeStr];
        googleMapLocation['image'] = this.dataService.imageMap[buildingCodeStr];
      }
    }
    return googleMapLocation;
  }

  formatEventTime(start: Date, end: Date): string {
    const weekdayFormatter = new Intl.DateTimeFormat('en-CA', { weekday: 'short' });
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const day = weekdayFormatter.format(start).slice(0, 2); // "Mo"
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
