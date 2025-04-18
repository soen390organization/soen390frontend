/// <reference types="google.maps" />
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { EventType } from 'src/app/enums/event-type.enum';
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
    if ((window as any).Cypress) {
      // Cypress Test Mode
      this.accessToken = 'mock-access-token';
      const calendars = await this.getUserCalendars();
      this.calendarsSubject.next(calendars);
      this.setSelectedCalendar(calendars[0].id);
      return true;
    }
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
      return data.items ?? [];
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

      const locationItemsPromises = data.items.map((event) => this.transformEvent(event));
      const locationItems = await Promise.all(locationItemsPromises);
      this.previouslyFetchedEvents[calendarId] = locationItems;
      return locationItems ?? [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  async transformEvent(event: any): Promise<EventInfo> {
    const eventType = event.summary.split(' ')[1] ?? 'LEC';
    // Process the location information
    const roomInfo = this.getRoomInfo(event.location);
    const buildingData = this.convertClassToAddress(roomInfo.buildingCode ?? event.location);
    // Clone the coordinates if they exist to ensure we have a proper LatLng object
    const googleCoords = buildingData.coordinates
      ? new google.maps.LatLng(buildingData.coordinates.lat(), buildingData.coordinates.lng())
      : null;

    const indoorLocation = await this.mappedInService.findIndoorLocation(event.location);

    // Create event information
    return {
      title: event.summary,
      type: EventType[eventType.toUpperCase()],
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
      timeToNext: this.setTimeToNext(event.start.dateTime),
      googleLoc: {
        title: event.summary,
        address: buildingData.address,
        coordinates: googleCoords,
        image: buildingData.image,
        type: 'outdoor'
      },
      mappedInLoc: indoorLocation,
      room: event.location
    };
  }

  getRoomInfo(classCode: string): { roomId: any; roomName: string; buildingCode: string } {
    if (!classCode) {
      return {
        roomId: null,
        roomName: 'Unknown Room',
        buildingCode: ''
      };
    }

    // Extract building code and room number
    // Common patterns: H-531, MB-S2.330, FG-B080, etc.
    let buildingCode = '';
    let roomNumber = '';

    // First try to match the pattern like "H-531" or "MB-S2.330"
    const roomPattern = /^([A-Za-z]+(?:-[A-Za-z]+)*)[ -]([A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)$/;
    const match = roomPattern.exec(classCode.trim());

    if (match) {
      buildingCode = match[1].toUpperCase();
      roomNumber = match[2];
    } else {
      // If no pattern match, try to extract the building code from the beginning
      buildingCode = this.getBuildingCode(this.cleanUpInput(classCode));

      // Try to extract the room number part
      const parts = classCode.split(/[-\s]/);
      if (parts.length > 1) {
        // If there are multiple parts, take everything after the building code
        roomNumber = parts.slice(1).join('-');
      } else {
        // If no clear separation, assume the whole string is the room ID
        roomNumber = classCode;
      }
    }

    // This is the full room ID that will be used for matching in MappedIn
    const fullRoomId = buildingCode + '-' + roomNumber;

    return {
      roomId: fullRoomId,
      roomName: classCode,
      buildingCode: buildingCode
    };
  }

  convertClassToAddress(classCode: string): {
    address: string;
    coordinates: google.maps.LatLng | null;
    image: string;
  } {
    if (!classCode) {
      console.warn('Class code is undefined or empty');
      return {
        address: 'No Address',
        coordinates: null,
        image: 'assets/images/poi_fail.png'
      };
    }

    const buildingCodeChars = this.cleanUpInput(classCode);
    const buildingCodeStr = this.getBuildingCode(buildingCodeChars);

    if (!buildingCodeStr) {
      console.warn(`Unable to extract building code from: ${classCode}`);
      return {
        address: 'No Address',
        coordinates: null,
        image: 'assets/images/poi_fail.png'
      };
    }

    const locationObj = this.buildLocationObject(buildingCodeStr);

    // Ensure coordinates are a LatLng object if they exist in string form
    if (locationObj.coordinates === null && this.dataService.coordinatesMap[buildingCodeStr]) {
      const coords = this.dataService.coordinatesMap[buildingCodeStr];
      locationObj.coordinates = new google.maps.LatLng(
        parseFloat(coords.lat),
        parseFloat(coords.lng)
      );
    }

    return locationObj;
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
    if (!buildingCode) {
      return {
        address: 'No Address',
        coordinates: null,
        image: 'assets/images/poi_fail.png'
      };
    }

    const address = this.dataService.addressMap[buildingCode] ?? 'No Address';

    // Convert coordinates map entry (which might be strings) to LatLng
    let coordinates = null;
    const coordsFromMap = this.dataService.coordinatesMap[buildingCode];
    if (coordsFromMap) {
      try {
        coordinates = new google.maps.LatLng(
          parseFloat(coordsFromMap.lat),
          parseFloat(coordsFromMap.lng)
        );
      } catch (error) {
        console.error('Error creating LatLng for building code:', buildingCode, error);
      }
    }

    const image = this.dataService.imageMap[buildingCode] ?? 'assets/images/poi_fail.png';

    return {
      address,
      coordinates,
      image
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
      this.currentCalendarEvents.forEach((event) => this.setTimeToNext(event));
    });
  }

  getSelectedCalendar(): string | null {
    return this.selectedCalendarSubject.value;
  }

  setTimeToNext(start: Date | string): string {
    let startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return 'NaN';
    }
    let currentDate = new Date();

    //Thank you to https://www.sitelint.com/blog/get-days-between-two-dates-in-javascript#:~:text=To%20get%20the%20number%20of,based%20on%20the%20millisecond%20difference.
    let currentDateUTC = Date.UTC(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    let startDateUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let daysInBetween = Math.abs(
      (currentDateUTC.valueOf() - startDateUTC.valueOf()) / (24 * 60 * 60 * 1000)
    );
    let numMinutes = Math.floor(
      Math.abs(Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60))) % 60
    );
    let numHours = Math.floor(
      Math.abs(Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))) % 24
    );
    if (daysInBetween <= 0 && numHours == 0 && numMinutes == 0) {
      return 'Starts now.';
    } else {
      return (
        'In ' +
        (daysInBetween > 0 ? daysInBetween + ' days ' : '') +
        (numHours > 0 ? numHours + ' hours ' : '') +
        (numMinutes > 0 ? numMinutes + ' minutes' : '')
      );
    }
  }
}
