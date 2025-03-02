import { TestBed } from '@angular/core/testing';
import { ShuttleService } from './shuttle.service';

describe('Shuttle Service', () => {
  class MockLatLng {
    private latValue: number;
    private lngValue: number;
    constructor(lat: number, lng: number) {
      this.latValue = lat;
      this.lngValue = lng;
    }
    lat() {
      return this.latValue;
    }
    lng() {
      return this.lngValue;
    }
  }
  class MockPlacesService {
    findPlaceFromQuery(
      request: any,
      callback: (results: any, status: any) => void
    ) {
      // Just simulate a single result with lat/lng
      callback(
        [{ geometry: { location: new MockLatLng(45.5017, -73.5673) } }],
        'OK'
      );
    }
  }

  beforeEach(() => {
    (window as any).google = {
      maps: {
        LatLng: MockLatLng,
        places: { PlacesServiceStatus: { OK: 'OK' } },
      },
    } as any;
    TestBed.configureTestingModule({ providers: [ShuttleService] });
    service = TestBed.inject(ShuttleService);
    (service as any).placesService = new MockPlacesService();
  });
  let service: ShuttleService;
  describe('getNearestCampus()', () => {
    it("should return 'sgw' given coordinates near SGW", async () => {
      const coordsNearSgw = new google.maps.LatLng(
        45.49750005500292,
        -73.57751531044308
      );
      const sgw = service.getNearestCampus(coordsNearSgw);
      expect(sgw).toBe('sgw');
    });

    it("should return 'loy' given coordinates near loyola", async () => {
      const coordsNearLoy = new google.maps.LatLng(
        45.45736351335173,
        -73.64365638900644
      );
      const loy = service.getNearestCampus(coordsNearLoy);
      expect(loy).toBe('loy');
    });
  });

  describe('getNextBus()', () => {
    it('should return the next departure time (10:15) given Monday 10 am', () => {
      const monday10am = new Date('2025-03-03T10:00:00'); // Monday
      const result = service.getNextBus('loy', monday10am);
      expect(result).toBe('10:15');
    });

    it('should return the next departure time (14:15) given Thursday 2pm', () => {
      const thursday2pm = new Date('2025-03-06T14:00:00'); // Thursday
      const result = service.getNextBus('sgw', thursday2pm);
      expect(result).toBe('14:15');
    });

    it('should return "No departures for today." given saturday 10pm', () => {
      const saturday10pm = new Date('2025-03-08T22:00:00'); // Saturday
      const result = service.getNextBus('sgw', saturday10pm);
      expect(result).toBe('No departures for today.');
    });
  });

  describe('findCoords()', () => {
    it('should return the same LatLng if query is a LatLng instance', async () => {
      const latLng = new MockLatLng(40, -70);
      const result = await (service as any).findCoords(latLng);
      expect(result).toBe(latLng);
    });

    // Test when query is a string
    it('should call the mock placesService when query is a string', async () => {
      const result = await (service as any).findCoords('Some place');
      expect(result.lat()).toBe(45.5017);
      expect(result.lng()).toBe(-73.5673);
    });

    // Test error case
    it('should reject null if no results returned', async () => {
      spyOn((service as any).placesService, 'findPlaceFromQuery').and.callFake(
        (req: any, cb: any) => {
          cb([], 'OK'); // Return no results
        }
      );
      await expectAsync(
        (service as any).findCoords('Invalid place')
      ).toBeRejectedWith(null);
    });
  });
  describe('calculateShuttleBusRoute()', () => {

    it('should return walking steps if campuses match', async () => {
    });

    it('should include bus step if campuses differ', async () => {
    });

    it('should return "No more shuttle buses today" if getNextBus says so', async () => {
    });
  });
});
