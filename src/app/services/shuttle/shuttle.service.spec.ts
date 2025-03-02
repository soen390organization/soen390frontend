import { TestBed } from '@angular/core/testing';
import { ShuttleService } from './shuttle.service';
import { RouteService } from '../directions/directions.service';
import { Injector } from '@angular/core';

describe('ShuttleService', () => {
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
      callback(
        [{ geometry: { location: new MockLatLng(45.5017, -73.5673) } }],
        'OK'
      );
    }
  }

  let service: ShuttleService;
  let routeServiceSpy: jasmine.SpyObj<RouteService>;

  beforeEach(() => {
    (window as any).google = {
      maps: {
        LatLng: MockLatLng,
        TravelMode: {
          WALKING: 'WALKING',
          DRIVING: 'DRIVING',
        },
        places: { PlacesServiceStatus: { OK: 'OK' } },
      },
    } as any;

    const routeSpy = jasmine.createSpyObj('RouteService', [
      'calculateRoute',
      'getDirectionsRenderer',
    ]);

    routeSpy.getDirectionsRenderer.and.returnValue({} as any);

    TestBed.configureTestingModule({
      providers: [
        ShuttleService,
        { provide: RouteService, useValue: routeSpy },
        Injector,
      ],
    });

    service = TestBed.inject(ShuttleService);
    routeServiceSpy = TestBed.inject(
      RouteService
    ) as jasmine.SpyObj<RouteService>;

    (service as any).placesService = new MockPlacesService();

    routeServiceSpy.calculateRoute.and.returnValue(
      Promise.resolve({ steps: [], eta: null })
    );

    service['routeService'] = routeServiceSpy;
    service['renderers'] = [
      {},
      {},
      {},
    ] as unknown as google.maps.DirectionsRenderer[];
    service['initialized'] = true;
  });

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
      const monday10am = new Date('2025-03-03T10:00:00');
      const result = service.getNextBus('loy', monday10am);
      expect(result).toBe('10:15');
    });

    it('should return the next departure time (14:15) given Thursday 2pm', () => {
      const thursday2pm = new Date('2025-03-06T14:00:00');
      const result = service.getNextBus('sgw', thursday2pm);
      expect(result).toBe('14:15');
    });

    it('should return "No departures for today." given saturday 10pm', () => {
      const saturday10pm = new Date('2025-03-08T22:00:00');
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

    it('should call the mock placesService when query is a string', async () => {
      const result = await (service as any).findCoords('Some place');
      expect(result.lat()).toBe(45.5017);
      expect(result.lng()).toBe(-73.5673);
    });

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

  describe('Refactored private helpers', () => {
    describe('isNoBusAvailable()', () => {
      it('should return true for "No more shuttle buses today :("', () => {
        const result = (service as any).isNoBusAvailable(
          'No more shuttle buses today :('
        );
        expect(result).toBeTrue();
      });

      it('should return true for "No departures for today."', () => {
        const result = (service as any).isNoBusAvailable(
          'No departures for today.'
        );
        expect(result).toBeTrue();
      });

      it('should return false for a valid bus time (e.g. "10:15")', () => {
        const result = (service as any).isNoBusAvailable('10:15');
        expect(result).toBeFalse();
      });
    });

    describe('buildNoBusResponse()', () => {
      it('should build a response object with the given message', () => {
        const noBusMessage = 'No more shuttle buses today :(';
        const response = (service as any).buildNoBusResponse(noBusMessage);
        expect(response.steps[0].instructions).toBe(noBusMessage);
        expect(response.eta).toBe('N/A');
      });
    });

    describe('fetchCoordinates()', () => {
      it('should return startCoords, destinationCoords, startCampus, destinationCampus', async () => {
        spyOn(service as any, 'findCoords').and.callFake((input: string) => {
          if (input === 'Start') {
            return Promise.resolve(new MockLatLng(45.497, -73.578)); // near SGW
          } else {
            return Promise.resolve(new MockLatLng(45.457, -73.643)); // near LOY
          }
        });

        const result = await (service as any).fetchCoordinates(
          'Start',
          'Destination'
        );
        expect(result.startCoords.lat()).toBe(45.497);
        expect(result.startCampus).toBe('sgw');
        expect(result.destinationCoords.lat()).toBe(45.457);
        expect(result.destinationCampus).toBe('loy');
      });
    });

    describe('buildSameCampusSteps()', () => {
      it('should call calculateRoute once with WALKING', async () => {
        routeServiceSpy.calculateRoute.and.returnValue(
          Promise.resolve({
            steps: [
              {
                instructions: 'Walk',
                start_location: null,
                end_location: null,
              },
            ],
            eta: 'N/A',
          })
        );

        const steps = await (service as any).buildSameCampusSteps(
          'Start',
          'Destination'
        );

        expect(routeServiceSpy.calculateRoute).toHaveBeenCalledTimes(1);
        expect(routeServiceSpy.calculateRoute).toHaveBeenCalledWith(
          'Start',
          'Destination',
          google.maps.TravelMode.WALKING
        );
        expect(steps.length).toBe(1);
        expect(steps[0].instructions).toBe('Walk');
      });
    });

    describe('buildDifferentCampusSteps()', () => {
      it('should call calculateRoute three times and include shuttle instructions', async () => {
        routeServiceSpy.calculateRoute
          .withArgs(
            'Start',
            jasmine.any(String),
            google.maps.TravelMode.WALKING,
            jasmine.anything()
          )
          .and.returnValue(
            Promise.resolve({
              steps: [
                {
                  instructions: 'Walk to terminal',
                  start_location: null,
                  end_location: null,
                },
              ],
              eta: 'N/A',
            })
          );

        routeServiceSpy.calculateRoute
          .withArgs(
            jasmine.any(String),
            jasmine.any(String),
            google.maps.TravelMode.DRIVING,
            jasmine.anything()
          )
          .and.returnValue(
            Promise.resolve({
              steps: [
                {
                  instructions: 'Shuttle Ride',
                  start_location: null,
                  end_location: null,
                },
              ],
              eta: 'N/A',
            })
          );

        routeServiceSpy.calculateRoute
          .withArgs(
            jasmine.any(String),
            'Destination',
            google.maps.TravelMode.WALKING,
            jasmine.anything()
          )
          .and.returnValue(
            Promise.resolve({
              steps: [
                {
                  instructions: 'Walk to final',
                  start_location: null,
                  end_location: null,
                },
              ],
              eta: 'N/A',
            })
          );

        const steps = await (service as any).buildDifferentCampusSteps(
          'Start',
          'Destination',
          'sgw',
          'loy',
          '10:00 AM'
        );

        expect(routeServiceSpy.calculateRoute).toHaveBeenCalledTimes(3);
        expect(steps.length).toBe(2);
      });
    });
  });

  describe('calculateShuttleBusRoute()', () => {
    it('should return a no-bus response if nextBus is "No more shuttle buses today :("', async () => {
      spyOn(service as any, 'fetchCoordinates').and.returnValue(
        Promise.resolve({
          startCoords: new MockLatLng(45.497, -73.578),
          destinationCoords: new MockLatLng(45.458, -73.64),
          startCampus: 'sgw',
          destinationCampus: 'loy',
        })
      );
      spyOn(service, 'getNextBus').and.returnValue(
        'No more shuttle buses today :('
      );

      const result = await service.calculateShuttleBusRoute(
        'Start',
        'Destination'
      );
      expect(result.steps[0].instructions).toBe(
        'No more shuttle buses today :('
      );
      expect(result.eta).toBe('N/A');
      expect(routeServiceSpy.calculateRoute).not.toHaveBeenCalled();
    });

    it('should handle same-campus travel by calling buildSameCampusSteps()', async () => {
      spyOn(service as any, 'fetchCoordinates').and.returnValue(
        Promise.resolve({
          startCoords: new MockLatLng(45.497, -73.578),
          destinationCoords: new MockLatLng(45.497, -73.578),
          startCampus: 'sgw',
          destinationCampus: 'sgw',
        })
      );
      spyOn(service, 'getNextBus').and.returnValue('10:00 AM');
      const sameCampusSpy = spyOn(
        service as any,
        'buildSameCampusSteps'
      ).and.returnValue(
        Promise.resolve([{ instructions: 'Walk around campus' }])
      );

      const result = await service.calculateShuttleBusRoute(
        'Start',
        'Destination'
      );
      expect(sameCampusSpy).toHaveBeenCalled();
      expect(result.steps[0].instructions).toBe('Walk around campus');
      expect(result.eta).toBe('TBD');
    });

    it('should handle different-campus travel by calling buildDifferentCampusSteps()', async () => {
      spyOn(service as any, 'fetchCoordinates').and.returnValue(
        Promise.resolve({
          startCoords: new MockLatLng(45.497, -73.578),
          destinationCoords: new MockLatLng(45.457, -73.643),
          startCampus: 'sgw',
          destinationCampus: 'loy',
        })
      );
      spyOn(service, 'getNextBus').and.returnValue('10:00 AM');
      const differentCampusSpy = spyOn(
        service as any,
        'buildDifferentCampusSteps'
      ).and.returnValue(
        Promise.resolve([{ instructions: 'Steps for Inter-campus' }])
      );

      const result = await service.calculateShuttleBusRoute(
        'Start',
        'Destination'
      );
      expect(differentCampusSpy).toHaveBeenCalled();
      expect(result.steps[0].instructions).toBe('Steps for Inter-campus');
      expect(result.eta).toBe('TBD');
    });
  });
});
