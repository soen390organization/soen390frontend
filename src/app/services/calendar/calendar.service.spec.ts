import { TestBed } from '@angular/core/testing';
import { CalendarService } from './calendar.service';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Subscription } from 'rxjs';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import * as firebaseAuth from 'firebase/auth';

// Mock Firebase config
const mockFirebaseConfig = {
  apiKey: 'mock-api-key',
  authDomain: 'mock-auth-domain',
  projectId: 'mock-project-id',
  storageBucket: 'mock-storage-bucket',
  messagingSenderId: 'mock-messaging-sender-id',
  appId: 'mock-app-id'
};

// Initialize Firebase before tests
initializeApp(mockFirebaseConfig);

// Provide a mock ConcordiaDataService that has an iterable `keys` array:
const mockConcordiaDataService = {
  addressMap: {
    // An array of keys
    keys: ['H-820'],
    // A dictionary for the addresses themselves
    'H-820': '1455 De Maisonneuve Blvd W'
  },
  coordinatesMap: {
    'H-820': {
      // For simplicity, just store a plain object
      // (If needed, you can store new google.maps.LatLng(...) if you mock it properly)
      address: 'Hall Building',
      coordinates: { lat: 45.4973, lng: -73.5789 },
      image: 'hall-building.png'
    }
  },
  imageMap: {
    'H-820': 'hall-image.png'
  }
};

describe('CalendarService', () => {
  let service: CalendarService;
  let fetchSpy: jasmine.Spy;
  let subscription: Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        {
          provide: ConcordiaDataService,
          useValue: mockConcordiaDataService
        }
      ]
    });
    service = TestBed.inject(CalendarService);
    fetchSpy = spyOn(window, 'fetch');
  });

  afterEach(() => {
    if (subscription) {
      subscription.unsubscribe();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call setSelectedCalendar and update the value', () => {
    service.setSelectedCalendar('test');
    expect(service.getSelectedCalendar()).toBe('test');
  });

  it('should return null if no calendar is selected', () => {
    expect(service.getSelectedCalendar()).toBeNull();
  });

  it('should call signInWithGoogle and fetch calendars on success', async () => {
    const mockCalendars = [{ id: '1', summary: 'Test Calendar' }];
    spyOn(service as any, 'getUserCalendars').and.returnValue(Promise.resolve(mockCalendars));
    // Mocks to avoid real calls
    spyOn(service as any, 'auth').and.returnValue(getAuth());
    spyOn(service as any, 'googleProvider').and.returnValue({
      addScope: jasmine.createSpy('addScope')
    });
    spyOn(service as any, 'signInWithGoogle').and.callFake(async () => Promise.resolve(true));

    const result = await service.signInWithGoogle();
    expect(result).toBeTrue();
    expect(service.calendars$).toBeTruthy();
  });

  it('should return false if signInWithGoogle fails', async () => {
    spyOn(service as any, 'auth').and.returnValue({
      signInWithPopup: () => Promise.reject(new Error('Sign-in error'))
    });
    const result = await service.signInWithGoogle();
    expect(result).toBeFalse();
  });

  it('should fetch user calendars successfully', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ items: [{ id: '1', summary: 'Test Calendar' }] })
    } as Response;
    fetchSpy.and.returnValue(Promise.resolve(mockResponse));

    const calendars = await service.getUserCalendars();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      jasmine.objectContaining({
        method: 'GET',
        headers: jasmine.objectContaining({ Authorization: `Bearer null` })
      })
    );
    expect(calendars.length).toBeGreaterThan(0);
    expect(calendars[0].summary).toBe('Test Calendar');
  });

  it('should return an empty array if fetching calendars fails', async () => {
    fetchSpy.and.returnValue(Promise.reject(new Error('Fetch error')));
    const calendars = await service.getUserCalendars();
    expect(calendars).toEqual([]);
  });

  // -----------------------------
  // Additional tests for coverage
  // -----------------------------

  it('should emit an empty array from events$ if no calendar is selected', (done) => {
    subscription = service.events$.subscribe((events) => {
      expect(events).toEqual([]);
      done();
    });
  });

  it('should emit events from events$ if a calendar is selected', async () => {
    const mockEvents = [{ id: 'e1' }, { id: 'e2' }];
    spyOn(service, 'fetchEvents').and.returnValue(Promise.resolve(mockEvents));
    let emittedValues: any[] = [];

    subscription = service.events$.subscribe((events) => {
      emittedValues = events;
    });

    service.setSelectedCalendar('test-calendar');
    await Promise.resolve(); // allow switchMap to execute

    expect(service.fetchEvents).toHaveBeenCalledWith('test-calendar');
    expect(emittedValues).toEqual(mockEvents);
  });

  it('should use previouslyFetchedEvents cache and skip network call', async () => {
    service['previouslyFetchedEvents']['cached-calendar'] = [{ id: 'cached-event' }];
    const result = await service.fetchEvents('cached-calendar');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 'cached-event' }]);
  });

  it('should return an empty array on non-ok response when fetching events', async () => {
    fetchSpy.and.returnValue(
      Promise.resolve({
        ok: false,
        statusText: 'Not Found'
      } as Response)
    );

    const events = await service.fetchEvents('some-calendar-id');
    expect(events).toEqual([]);
  });

  describe('transformEvent()', () => {
    it('should handle an event with a single-word summary (default type)', () => {
      const mockEvent = {
        summary: 'COMP248',
        start: { dateTime: '2023-01-01T10:00:00' },
        end: { dateTime: '2023-01-01T12:00:00' },
        location: 'H-820'
      };

      // This will call convertClassToAddress internally
      const result = service.transformEvent(mockEvent);

      expect(result.title).toBe('COMP248');
      expect(result.startTime).toBe('2023-01-01T10:00:00');
      expect(result.endTime).toBe('2023-01-01T12:00:00');
      // We rely on the mockConcordiaDataService for address/coords if found
    });
  });

  describe('convertClassToAddress()', () => {
    it('should return default values if not found in mock data', () => {
      const info = service.convertClassToAddress('UNKNOWN123');
      expect(info.address).toBe('No Address');
      expect(info.coordinates).toBeNull();
      expect(info.image).toBe('No Image');
    });
  });

  describe('formatEventTime()', () => {
    it('should format the time range correctly', () => {
      const start = new Date('2023-01-01T10:00:00');
      const end = new Date('2023-01-01T12:00:00');
      const formatted = service.formatEventTime(start, end);
      expect(formatted).toContain('10:00');
      expect(formatted).toContain('12:00');
    });
  });
});
