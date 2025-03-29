// shuttle-data.service.spec.ts

import { ShuttleDataService } from './shuttle-data.service';
import data from 'src/assets/shuttle-data.json';

describe('ShuttleDataService', () => {
  let service: ShuttleDataService;
  let originalSchedule: any;

  beforeEach(() => {
    // Save a deep copy of the original schedule so we can restore it later.
    originalSchedule = JSON.parse(JSON.stringify(data.schedule));
    service = new ShuttleDataService();
    jasmine.clock().install();
  });

  afterEach(() => {
    // Restore original schedule and uninstall clock.
    data.schedule = originalSchedule;
    jasmine.clock().uninstall();
  });

  it('should return null if no schedule exists for the day', () => {
    // Set fake date to a day that does NOT exist in the schedule.
    const fakeDate = new Date('2021-09-18T10:00:00'); // Saturday
    jasmine.clock().mockDate(fakeDate);

    // Ensure that the schedule for Saturday is not defined.
    delete data.schedule['Saturday'];

    const result = service.getNextBus('loy');
    expect(result).toBeNull();
  });

  it('should return the next departure time if one exists', () => {
    // Set fake date to Monday at 09:30.
    const fakeDate = new Date('2021-09-13T09:30:00'); // Monday
    jasmine.clock().mockDate(fakeDate);

    // Create a schedule for Monday with departures for campus "loy" and an empty array for "sgw"
    data.schedule['Monday'] = {
      loy: ['09:45', '10:00', '10:15'],
      sgw: []
    };

    const result = service.getNextBus('loy');
    expect(result).toBe('09:45');
  });

  it('should return null if no departures are after the current time', () => {
    // Set fake date to Monday at 10:20.
    const fakeDate = new Date('2021-09-13T10:20:00'); // Monday
    jasmine.clock().mockDate(fakeDate);

    // Create a schedule for Monday with departures for campus "loy" and an empty array for "sgw"
    data.schedule['Monday'] = {
      loy: ['09:45', '10:00', '10:15'],
      sgw: []
    };

    const result = service.getNextBus('loy');
    expect(result).toBeNull();
  });
});
