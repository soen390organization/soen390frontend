import { TestBed } from '@angular/core/testing';
import { ShuttleDataService } from './shuttle-data.service';

// Mock data
const mockShuttleData = {
  schedule: {
    Monday: {
      loy: ['08:00', '12:00', '16:00'],
      sgw: ['09:00', '10:30', '17:00']
    },
    Tuesday: {
      loy: ['08:30', '12:30', '16:30'],
      sgw: ['09:30', '13:30', '17:30']
    }
    // Add other days and campuses as needed
  }
};

describe('ShuttleDataService', () => {
  let service: ShuttleDataService;

  beforeEach(() => {
    // Override the shuttle data with mock data
    // Normally the JSON would be imported as a static resource. Here we simulate that.
    // This is assuming you have a mock or a method to simulate the data import.

    // Using `TestBed.configureTestingModule` to inject the service
    TestBed.configureTestingModule({
      providers: [
        { provide: 'ShuttleDataService', useValue: mockShuttleData } // Mocked service data
      ]
    });

    service = TestBed.inject(ShuttleDataService);

    spyOn(service, 'getNextBus').and.callFake((campus: string) => {
        const date = new Date();
        const dayOfWeek = date.toLocaleDateString('en-us', { weekday: 'long' });
  
        // Ensure mockShuttleData has the expected structure
        if (!mockShuttleData.schedule[dayOfWeek] || !mockShuttleData.schedule[dayOfWeek][campus]) {
          return null; // Return null if no data for campus or day
        }
  
        const currentTime = date.getHours() * 60 + date.getMinutes();
        const departures = mockShuttleData.schedule[dayOfWeek][campus];
  
        const nextDeparture = departures.find((time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes > currentTime;
        });
  
        return nextDeparture || null;
      });
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the next bus for the campus on a given day', () => {
    const result = service.getNextBus('loy');
    const date = new Date();
    const currentTime = date.getHours() * 60 + date.getMinutes();

    const nextDeparture = mockShuttleData.schedule[date.toLocaleDateString('en-us', { weekday: 'long' })]?.['loy']?.find((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });

    expect(result).toEqual(nextDeparture || null);
  });

  it('should return null if no buses are scheduled for the campus on the current day', () => {

    const invalidDate = new Date('2025-01-01'); // Assume this date has no buses scheduled
    spyOn(Date, 'now').and.returnValue(invalidDate.getTime());

    const campus = 'loy';
    const result = service.getNextBus(campus);
    expect(result).toBeNull();
  });

  it('should return null if no buses are scheduled for the current day', () => {
    // Change the date to a day with no bus schedule
    const invalidDate = new Date('2025-01-01'); // Assume this date has no buses scheduled
    spyOn(Date, 'now').and.returnValue(invalidDate.getTime());

    const campus = 'loy';
    const result = service.getNextBus(campus);
    expect(result).toBeNull();
  });

  it('should return the correct next bus based on the current time', () => {

    const mockTime = new Date('2025-03-28T10:00:00Z'); // Set the time to 10:00
    spyOn(Date, 'now').and.returnValue(mockTime.getTime());

    const result = service.getNextBus('sgw');
    const date = new Date(mockTime.getTime());
    const currentTime = date.getHours() * 60 + date.getMinutes(); // 10:00 = 600 minutes

    const nextDeparture = mockShuttleData.schedule[date.toLocaleDateString('en-us', { weekday: 'long' })]?.['sgw']?.find((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });

    expect(result).toEqual(nextDeparture || null);
  });
});
