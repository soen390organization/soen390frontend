import { DirectionsService, Location } from './directions.service';
import { TestBed } from '@angular/core/testing';
import { Step } from 'src/app/interfaces/step.interface';
import Joi from 'joi';

describe('Directions Service', () => {
  let service: DirectionsService;
  let origin = 'Hall Building Concordia';
  let destination = 'John Molson School of Business';

  class MockDirectionsService {
    route = jasmine.createSpy('route');
  }

  class MockDirectionsRenderer {
    setMap = jasmine.createSpy('setMap');
    setOptions = jasmine.createSpy('setOptions');
    setDirections = jasmine.createSpy('setDirections');
    set = jasmine.createSpy('set');
    getMap = jasmine.createSpy('getMap');
  }

  let mockMap: any;

  beforeEach(() => {
    mockMap = {
      setCenter: jasmine.createSpy('setCenter'),
      setZoom: jasmine.createSpy('setZoom'),
      fitBounds: jasmine.createSpy('fitBounds'),
    };

    (window as any).google = {
      maps: {
        DirectionsService: MockDirectionsService,
        DirectionsRenderer: MockDirectionsRenderer,
        TravelMode: {
          DRIVING: 'DRIVING',
          TRANSIT: 'TRANSIT',
          WALKING: 'WALKING',
        },
        DirectionsStatus: {
          OK: 'OK',
        },
        SymbolPath: { CIRCLE: 'CIRCLE' },
      },
    } as any;

    TestBed.configureTestingModule({
      providers: [DirectionsService],
    });
    service = TestBed.inject(DirectionsService);
    service.initialize({} as google.maps.Map);
    (service as any).directionsRenderer.getMap.and.returnValue(mockMap);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateRoute()', () => {
    describe('given a valid origin and destination', () => {
      it('should return a valid json', async () => {
        (service as any).directionsService.route.and.callFake(
          (
            request: google.maps.DirectionsRequest,
            callback: (
              result: google.maps.DirectionsResult,
              status: google.maps.DirectionsStatus,
            ) => void,
          ) => {
            const mockResponse = {
              routes: [
                {
                  legs: [
                    {
                      duration: { text: '5 mins', value: 300 },
                      steps: [
                        {
                          instructions: 'Head north',
                          start_location: { lat: () => 45, lng: () => -73 }, // Mocking LatLng functions
                          end_location: { lat: () => 46, lng: () => -74 }, // Mocking LatLng functions
                          distance: { text: '1 km', value: 1000 },
                          duration: { text: '10 mins', value: 600 },
                          transit_details: null,
                        },
                      ],
                    },
                  ],
                },
              ],
            } as unknown as google.maps.DirectionsResult;

            callback(mockResponse, google.maps.DirectionsStatus.OK);
          },
        );

        const schema = Joi.object({
          steps: Joi.array()
            .items(
              Joi.object({
                instructions: Joi.string().required(),
                start_location: Joi.any().required(),
                end_location: Joi.any().required(),
                distance: Joi.object({
                  text: Joi.string().required(),
                  value: Joi.number().required(),
                }).optional(),
                duration: Joi.object({
                  text: Joi.string().required(),
                  value: Joi.number().required(),
                }).optional(),
                transit_details: Joi.any().optional(),
              }),
            )
            .required(),
          eta: Joi.string().allow(null).required(),
        });

        spyOn(service, 'calculateRoute').and.callThrough();
        const response = await service.calculateRoute(origin, destination);
        expect(schema.validate(response).error).toBeUndefined();
      });
    });
  });

  describe('setRouteColor() function', () => {
    describe('given the travel mode is DRIVING', () => {
      it('should return the color red', async () => {
        const polylineOptions = service.setRouteColor(
          google.maps.TravelMode.DRIVING,
        );
        expect(polylineOptions).toEqual({ strokeColor: 'red' });
      });
    });
    describe('given the travel mode is TRANSIT', () => {
      it('should return the color green', async () => {
        const polylineOptions = service.setRouteColor(
          google.maps.TravelMode.TRANSIT,
        );
        expect(polylineOptions).toEqual({ strokeColor: 'green' });
      });
    });
    describe('given the travel mode is WALKING', () => {
      it('should return a specific json', async () => {
        const polylineOptions = service.setRouteColor(
          google.maps.TravelMode.WALKING,
        );
        expect(polylineOptions).toEqual({
          strokeColor: '#0096FF',
          strokeOpacity: 0,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillOpacity: 1,
                scale: 3,
              },
              offset: '0',
              repeat: '10px',
            },
          ],
        });
      });
    });
  });

  describe('Clear methods', () => {
    let mockMarker: any;

    beforeEach(() => {
      mockMarker = {
        setMap: jasmine.createSpy('setMap'),
        getPosition: jasmine.createSpy('getPosition').and.returnValue({ lat: () => 45, lng: () => -73 }),
      };
    });

    it('clearStartPoint should remove marker and clear the route', () => {
      (service as any).startPoint$.next({ title: 'Test Start', address: 'Test Address', coordinates: {} as google.maps.LatLng, marker: mockMarker });
      (service as any).destinationPoint$.next({ title: 'Test Dest', address: 'Test Address 2', coordinates: {} as google.maps.LatLng, marker: {
        setMap: jasmine.createSpy('setMap'),
        getPosition: () => ({ lat: () => 0, lng: () => 0 })
      } });

      service.clearStartPoint();

      expect(mockMarker.setMap).toHaveBeenCalledWith(null);
      expect((service as any).startPoint$.value).toBeNull();
      expect((service as any).directionsRenderer.set).toHaveBeenCalledWith('directions', null);
    });

    it('clearDestinationPoint should remove marker and clear the route', () => {
      const destMarker = {
        setMap: jasmine.createSpy('setMap'),
        getPosition: jasmine.createSpy('getPosition').and.returnValue({ lat: () => 40, lng: () => -80 }),
      };
      (service as any).destinationPoint$.next({ title: 'Test Dest', address: 'Test Address', coordinates: {} as google.maps.LatLng, marker: destMarker });
      (service as any).startPoint$.next({ title: 'Test Start', address: 'Test Address 2', coordinates: {} as google.maps.LatLng, marker: {
        setMap: jasmine.createSpy('setMap'),
        getPosition: () => ({ lat: () => 0, lng: () => 0 })
      } });

      service.clearDestinationPoint();

      expect(destMarker.setMap).toHaveBeenCalledWith(null);
      expect((service as any).destinationPoint$.value).toBeNull();
      expect((service as any).directionsRenderer.set).toHaveBeenCalledWith('directions', null);
    });
  });
});

describe('DirectionsService - Start/Destination Points and Observables', () => {
  let service: DirectionsService;
  let mockMarker: any;
  let mockMap: any;

  class MockDirectionsService {
    route = jasmine.createSpy('route');
  }

  class MockDirectionsRenderer {
    setMap = jasmine.createSpy('setMap');
    setOptions = jasmine.createSpy('setOptions');
    setDirections = jasmine.createSpy('setDirections');
    set = jasmine.createSpy('set');
    getMap = jasmine.createSpy('getMap');
  }

  beforeEach(() => {
    mockMarker = {
      setPosition: jasmine.createSpy('setPosition'),
      setMap: jasmine.createSpy('setMap'),
      getPosition: jasmine.createSpy('getPosition').and.returnValue({ lat: () => 45, lng: () => -73 }),
    };

    mockMap = {
      setCenter: jasmine.createSpy('setCenter'),
      setZoom: jasmine.createSpy('setZoom'),
      fitBounds: jasmine.createSpy('fitBounds'),
    };

    // Correctly mocking Google Maps objects
    (window as any).google = {
      maps: {
        DirectionsService: MockDirectionsService, // Correctly mocked DirectionsService
        DirectionsRenderer: MockDirectionsRenderer, // Correctly mocked DirectionsRenderer
        LatLngBounds: jasmine.createSpy('LatLngBounds').and.returnValue({
          extend: jasmine.createSpy('extend'),
        }),
        Marker: jasmine.createSpy('Marker').and.returnValue(mockMarker),
        TravelMode: {
          WALKING: 'WALKING',
          DRIVING: 'DRIVING',
          TRANSIT: 'TRANSIT',
        },
        DirectionsStatus: {
          OK: 'OK',
        },
        SymbolPath: { CIRCLE: 'CIRCLE' },
      },
    };

    TestBed.configureTestingModule({
      providers: [DirectionsService],
    });

    service = TestBed.inject(DirectionsService);
    service.initialize(mockMap);

    // Mock getMap to return mockMap
    (service as any).directionsRenderer.getMap.and.returnValue(mockMap);
    spyOn(service as any, 'updateMapView').and.callFake(() => {}); // Avoid side effects
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get startPoint$ observable', (done) => {
    service.getStartPoint().subscribe((startPoint) => {
      expect(startPoint).toBeNull();
      done();
    });
  });

  it('should get destinationPoint$ observable', (done) => {
    service.getDestinationPoint().subscribe((destinationPoint) => {
      expect(destinationPoint).toBeNull();
      done();
    });
  });

  it('should return null when getting shortest route if none exist', () => {
    expect(service.getShortestRoute()).toBeNull();
  });

  it('should return shortest route if it exists', () => {
    (service as any).shortestRoute = { eta: '10 mins', distance: 5000 };
    expect(service.getShortestRoute()).toEqual({ eta: '10 mins', distance: 5000 });
  });

  it('should emit hasBothPoints$ as false when points are missing', (done) => {
    service.hasBothPoints$.subscribe((hasBoth) => {
      expect(hasBoth).toBeFalse();
      done();
    });
  });

  it('should emit hasBothPoints$ as true when both points are set', (done) => {
    (service as any).startPoint$.next({ title: 'Start', address: 'Start Address', coordinates: {} as google.maps.LatLng });
    (service as any).destinationPoint$.next({ title: 'Destination', address: 'Destination Address', coordinates: {} as google.maps.LatLng });

    service.hasBothPoints$.subscribe((hasBoth) => {
      expect(hasBoth).toBeTrue();
      done();
    });
  });

  it('should call updateMapView when showDirections() is triggered', () => {
    service.showDirections();
    expect((service as any).updateMapView).toHaveBeenCalled();
  });
});

describe('DirectionsService - calculateShortestRoute()', () => {
  let service: DirectionsService;
  let mockCalculateRoute: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DirectionsService],
    });

    service = TestBed.inject(DirectionsService);

    // Correct mock for calculateRoute function
    mockCalculateRoute = spyOn(service, 'calculateRoute').and.callFake(
      (
        start: string | google.maps.LatLng,
        destination: string | google.maps.LatLng,
        mode: google.maps.TravelMode,
        render: boolean
      ): Promise<{ steps: Step[]; eta: string }> => {
        let duration = 0;

        switch (mode) {
          case google.maps.TravelMode.DRIVING:
            duration = 500; // 500 seconds
            break;
          case google.maps.TravelMode.WALKING:
            duration = 700; // 700 seconds
            break;
          case google.maps.TravelMode.TRANSIT:
            duration = 900; // 900 seconds
            break;
        }

        return Promise.resolve({
          steps: [
            {
              instructions: `Move ${mode}`, // Mocked instruction
              start_location: {} as google.maps.LatLng,
              end_location: {} as google.maps.LatLng,
              distance: { text: '1 km', value: 1000 },
              duration: { text: `${duration / 60} mins`, value: duration },
              transit_details: null,
            },
          ],
          eta: `${Math.round(duration / 60)} mins`,
        });
      }
    );
  });

  it('should calculate the shortest route correctly', async () => {
    const start = 'Start Location';
    const destination = 'Destination Location';
  
    await service.calculateShortestRoute(start, destination);
  
    // Verify calculateRoute() was called for all three modes
    expect(mockCalculateRoute).toHaveBeenCalledTimes(4);
  
    // Verify that all routes were stored (3 routes)
    expect((service as any).allRoutesData.length).toBe(3);
  
    // The shortest duration should be for DRIVING (500 seconds)
    expect((service as any).shortestRoute).toEqual({
      mode: google.maps.TravelMode.DRIVING,
      eta: '8 mins', // 500 seconds = ~8 minutes
      distance: 1000, // From mock data
      duration: 500,
    });
  
    // Ensure calculateRoute was called with the fastest mode
    expect(mockCalculateRoute).toHaveBeenCalledWith(start, destination, google.maps.TravelMode.DRIVING, false);
  });
  
});
