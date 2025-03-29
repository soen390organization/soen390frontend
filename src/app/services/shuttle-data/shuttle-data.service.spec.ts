import { TestBed } from '@angular/core/testing';
import { ShuttleDataService } from './shuttle-data.service';

// Mock data
const mockShuttleData = {
  schedule: {
    Monday: {
      campus1: ['08:00', '12:00', '16:00'],
      campus2: ['09:00', '13:00', '17:00']
    },
    Tuesday: {
      campus1: ['08:30', '12:30', '16:30'],
      campus2: ['09:30', '13:30', '17:30']
    }
    // Add other days and campuses as needed
  }
};

describe('ShuttleDataService', () => {
  let service: ShuttleDataService;

  beforeEach(() => {
    // Mock the data import
    spyOnProperty(require('src/assets/shuttle-data.json'), 'default', 'get').and.returnValue(mockShuttleData);

    TestBed.configureTestingModule({});
    service = TestBed.inject(ShuttleDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the next bus for the campus on a given day', () => {
    const campus = 'campus1';
    const result = service.getNextBus(campus);
    const date = new Date();
    const currentTime = date.getHours() * 60 + date.getMinutes();

    // Find the next bus departure that is later than the current time
    const nextDeparture = mockShuttleData.schedule[date.toLocaleDateString('en-us', { weekday: 'long' })][campus].find((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });

    expect(result).toEqual(nextDeparture || null);
  });

  it('should return null if no buses are scheduled for the campus on the current day', () => {
    const campus = 'nonExistentCampus';
    const result = service.getNextBus(campus);
    expect(result).toBeNull();
  });

  it('should return null if no buses are scheduled for the current day', () => {
    // Change the date to a day with no bus schedule
    const invalidDate = new Date('2025-01-01'); // Assume this date has no buses scheduled
    spyOn(Date, 'now').and.returnValue(invalidDate.getTime());

    const campus = 'campus1';
    const result = service.getNextBus(campus);
    expect(result).toBeNull();
  });

  it('should return the correct next bus based on the current time', () => {
    const campus = 'campus2';
    const result = service.getNextBus(campus);
    const date = new Date();
    const currentTime = date.getHours() * 60 + date.getMinutes();

    // Find the next bus departure for campus2
    const nextDeparture = mockShuttleData.schedule[date.toLocaleDateString('en-us', { weekday: 'long' })][campus].find((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });

    expect(result).toEqual(nextDeparture || null);
  });
});
