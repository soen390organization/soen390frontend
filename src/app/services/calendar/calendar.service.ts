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
  private readonly weekdayFormatter = new Intl.DateTimeFormat('en-CA', { weekday: 'short' });
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
      timeToNext: this.setTimeToNext(event.start.dateTime),
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
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const day = this.weekdayFormatter.format(start).slice(0, 2);
    const startTime = timeFormatter.format(start);
    const endTime = timeFormatter.format(end);

    return `${day}, ${startTime} - ${endTime}`;
  }

  async setSelectedCalendar(calendarId: string) {
    this.selectedCalendarSubject.next(calendarId);
    await this.fetchEvents(calendarId).then((events) => {
      this.currentCalendarEvents = events;
      this.currentCalendarEvents.forEach((event) => (this.setTimeToNext(event)));
    });
  }

  getSelectedCalendar(): string | null {
    return this.selectedCalendarSubject.value;
  }

  setTimeToNext(start: Date | string): string {
    var startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return "NaN";
    }
    var currentDate = new Date();
    var currentDay = currentDate.getDay();
    var currentCalendarDay = currentDate.getDate();
    if (currentDay == 0) {
      currentDay = 7;
    }
    console.log(currentDay);
    var startDayStr = this.weekdayFormatter.format(startDate).slice(0, 2);
    console.log(startDayStr);
    var startDayNum = 0;
    switch(startDayStr) {
      case "Su":
        startDayNum = 7;
        break;
      case "Mo":
        startDayNum = 1;
        break;
      case "Tu":
        startDayNum = 2;
        break;
      case "We":
        startDayNum = 3;
        break;
      case "Th":
        startDayNum = 4;
        break;  
      case "Fr":
        startDayNum = 5;
        break;  
      case "Sa":
        startDayNum = 6;
        break;  
    }
    var startCalendarDay = 0;
    if (currentDay != startDayNum) {
      startCalendarDay = currentCalendarDay + Math.abs(currentDay - startDayNum);
    }
    //Thank you to https://www.sitelint.com/blog/get-days-between-two-dates-in-javascript#:~:text=To%20get%20the%20number%20of,based%20on%20the%20millisecond%20difference.
    var currentDateUTC = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    var startDateUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    var daysInBetween = Math.abs((currentDateUTC.valueOf() - startDateUTC.valueOf()) / (24 * 60 * 60 * 1000));
    console.log(daysInBetween);
    var numMinutes = Math.floor(Math.abs(Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60))) % 60);
    console.log(numMinutes);
    var numHours = Math.floor(Math.abs(Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))) % 24);
    console.log(numHours);
    if (daysInBetween <= 0 && numHours == 0 && numMinutes == 0) {
      return "Starts now."
    } else {
      return "In " + (daysInBetween > 0 ? daysInBetween + " days " : "") + (numHours > 0 ? numHours + " hours " : "") + (numMinutes > 0 ? numMinutes + " minutes" : "");
    }
    
  }
}
