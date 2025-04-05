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
  // ---------------------------
  // Fields & Subjects
  // ---------------------------
  private readonly auth = getAuth();
  private readonly googleProvider = new GoogleAuthProvider();
  private accessToken: string | null = null;

  // Cache previously fetched events by calendar
  private previouslyFetchedEvents: Record<string, EventInfo[]> = {};

  // Stores the current calendar events
  currentCalendarEvents: EventInfo[] = [];

  // BehaviorSubject for available calendars
  private readonly calendarsSubject = new BehaviorSubject<any[]>([]);
  calendars$ = this.calendarsSubject.asObservable();

  // BehaviorSubject for selected calendar
  private readonly selectedCalendarSubject = new BehaviorSubject<string | null>(null);
  selectedCalendar$ = this.selectedCalendarSubject.asObservable();

  // Exposed events$ that depend on the selected calendar
  events$: Observable<EventInfo[]> = this.selectedCalendar$.pipe(
    switchMap((calendarId) => {
      if (!calendarId) return of([]);
      return this.fetchEvents(calendarId);
    })
  );

  // ---------------------------
  // Constructor
  // ---------------------------
  constructor(
    private readonly dataService: ConcordiaDataService,
    private readonly mappedInService: MappedinService
  ) {
    // Request read-only access to the user's Calendar data
    this.googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  }

  // ---------------------------
  // Public Methods
  // ---------------------------

  /**
   * Initiates Google Sign-In and fetches the user’s calendars.
   */
  async signInWithGoogle(): Promise<boolean> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('No credential or access token found');
      }
      this.accessToken = credential.accessToken;

      // Get all user calendars and push to calendarsSubject
      const calendars = await this.getUserCalendars();
      this.calendarsSubject.next(calendars);

      // Automatically select the first calendar
      if (calendars.length > 0) {
        await this.setSelectedCalendar(calendars[0].id);
      }

      return true;
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      return false;
    }
  }

  /**
   * Sets the selected calendar and immediately fetches its events.
   */
  async setSelectedCalendar(calendarId: string): Promise<void> {
    this.selectedCalendarSubject.next(calendarId);

    const events = await this.fetchEvents(calendarId);
    this.currentCalendarEvents = events;
  }

  /**
   * Returns the currently selected calendar ID.
   */
  getSelectedCalendar(): string | null {
    return this.selectedCalendarSubject.value;
  }

  /**
   * Converts a start and end Date to a short weekday/time string.
   * (e.g. "Mo, 14:00 - 15:00")
   */
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

  // ---------------------------
  // Private / Internal Methods
  // ---------------------------

  /**
   * Fetches the user's Google Calendars from the Calendar API.
   */
  private async getUserCalendars(): Promise<any[]> {
    try {
      const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
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

  /**
   * Fetches events for a specific calendar, within a 7-day range,
   * caching the results to avoid re-fetching.
   */
  private async fetchEvents(calendarId: string): Promise<EventInfo[]> {
    try {
      // Return cached events if we have them
      if (this.previouslyFetchedEvents[calendarId]) {
        return this.previouslyFetchedEvents[calendarId];
      }

      // Build the time range: from now to +7 days
      const now = new Date().toISOString();
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
      const timeMax = endOfWeek.toISOString();

      // Fetch the events
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${now}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.items) {
        return [];
      }

      // Transform raw events into EventInfo objects
      const eventPromises = data.items.map((event: any) => this.mapToEventInfo(event));
      const events = await Promise.all(eventPromises);

      // Cache results and return
      this.previouslyFetchedEvents[calendarId] = events;
      return events;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  /**
   * Converts a raw Google Calendar event into our custom EventInfo format.
   */
  private async mapToEventInfo(event: any): Promise<EventInfo> {
    // Extract the event type from the summary if it exists (e.g., "COMP 123 LEC")
    const summaryParts = event.summary?.split(' ') || [];
    const eventTypeKey = summaryParts[1] || 'LEC';

    // Convert building info from the location string
    const address = this.convertClassToAddress(event.location);
    const locationNumberMatch = event.location?.match(/\d+(\.\d+)?$/);
    const locationNumber = locationNumberMatch ? locationNumberMatch[0] : null;

    // If we have a room number + indoorMapId, get the Mappedin room
    let mappedinRoom = null;
    if (locationNumber && address.indoorMapId) {
      mappedinRoom = await this.getRoomId(locationNumber, address.indoorMapId);
    }

    return {
      title: event.summary,
      type: EventType[eventTypeKey.toUpperCase()],
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
      room: event.location,
      googleLoc: {
        title: event.summary,
        coordinates: address.coordinates,
        ...address,
        type: 'outdoor'
      },
      mappedInLoc: {
        title: event.summary,
        address: address.address,
        image: address.image,
        indoorMapId: address.indoorMapId,
        room: mappedinRoom,
        type: 'indoor'
      }
    };
  }

  /**
   * Cleans up the class code (e.g. "H-820") and builds the address details.
   */
  private convertClassToAddress(classCode: string): {
    address: string;
    coordinates: google.maps.LatLng | null;
    image: string;
    indoorMapId: string | null;
  } {
    const cleanedChars = this.cleanUpInput(classCode);
    const buildingCodeStr = this.getBuildingCode(cleanedChars);
    return this.buildLocationObject(buildingCodeStr);
  }

  /**
   * Removes spaces and invalid characters, leaving only alphanumeric.
   */
  private cleanUpInput(classCode: string): string[] {
    return classCode
      .split('')
      .filter((char) => char.trim().length > 0)
      .filter((char) => /[a-z0-9]/i.test(char));
  }

  /**
   * Extracts the building code portion from the array of characters,
   * stopping when digits begin (except for certain edge cases).
   */
  private getBuildingCode(chars: string[]): string {
    let result = '';
    let i = 0;

    while (i < chars.length) {
      const char = chars[i].toUpperCase();

      // Stop if we hit a digit
      if (/\d/.test(char)) {
        break;
      }

      // Skip "S" if it's followed by a digit
      if (char === 'S' && i + 1 < chars.length && /\d/.test(chars[i + 1])) {
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
   * Uses the building code to look up address, coordinates, image, etc.
   */
  private buildLocationObject(buildingCode: string): {
    address: string;
    coordinates: google.maps.LatLng | null;
    image: string;
    indoorMapId: string | null;
  } {
    return {
      address: this.dataService.addressMap[buildingCode] ?? 'No Address',
      coordinates: this.dataService.coordinatesMap[buildingCode] ?? null,
      image: this.dataService.imageMap[buildingCode] ?? 'No Image',
      indoorMapId: this.dataService.indoorMapIdMap[buildingCode] ?? null
    };
  }

  /**
   * Finds a matching room by name in the Mappedin data.
   */
  private async getRoomId(locationNumber: string, indoorMapId: string) {
    const mapData = await this.mappedInService.fetchMapData(indoorMapId);
    // Filter by name (exact match)
    const [room] = mapData.getByType('space').filter((space) => space.name === locationNumber);
    return room;
  }

  /**
   * Helper to construct headers for authorized fetch calls.
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json'
    };
  }
}
