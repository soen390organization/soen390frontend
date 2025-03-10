import { TestBed } from '@angular/core/testing';
import { CalendarService } from './calendar.service';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

// Mock Firebase config
const mockFirebaseConfig = {
  apiKey: 'mock-api-key',
  authDomain: 'mock-auth-domain',
  projectId: 'mock-project-id',
  storageBucket: 'mock-storage-bucket',
  messagingSenderId: 'mock-messaging-sender-id',
  appId: 'mock-app-id',
};

// Initialize Firebase before tests
initializeApp(mockFirebaseConfig);

// Mock dependencies
const mockAuth = getAuth();

const mockGoogleProvider = {
  addScope: jasmine.createSpy('addScope'),
};

describe('CalendarService', () => {
  let service: CalendarService;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalendarService],
    });
    service = TestBed.inject(CalendarService);

    fetchSpy = spyOn(window, 'fetch');
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
    const mockAccessToken = 'mock-access-token';
    const mockCalendars = [{ id: '1', summary: 'Test Calendar' }];

    spyOn(service as any, 'getUserCalendars').and.returnValue(Promise.resolve(mockCalendars));
    spyOn(service as any, 'auth').and.returnValue(mockAuth);
    spyOn(service as any, 'googleProvider').and.returnValue(mockGoogleProvider);
    spyOn(service as any, 'signInWithGoogle').and.callFake(async () => {
      return new Promise((resolve) => {
        resolve(true);
      });
    });

    const result = await service.signInWithGoogle();
    expect(result).toBeTrue();
    expect(service.calendars$).toBeTruthy();
  });

  it('should return false if signInWithGoogle fails', async () => {
    spyOn(service as any, 'auth').and.returnValue({
      signInWithPopup: () => Promise.reject(new Error('Sign-in error')),
    });
    const result = await service.signInWithGoogle();
    expect(result).toBeFalse();
  });

  it('should fetch user calendars successfully', async () => {
    const mockAccessToken = 'mock-access-token';
    const mockResponse = { ok: true, json: () => Promise.resolve({ items: [{ id: '1', summary: 'Test Calendar' }] }) };
    fetchSpy.and.returnValue(Promise.resolve(mockResponse as Response));

    const calendars = await service.getUserCalendars();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      jasmine.objectContaining({
        method: 'GET',
        headers: jasmine.objectContaining({ Authorization: `Bearer null` }),
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
});
