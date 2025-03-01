import { RouteService } from './directions.service';
import { TestBed } from '@angular/core/testing';
import Joi from 'joi';

describe('Directions Service', () => {
  let service: RouteService;
  let origin = 'Hall Building Concordia';
  let destination = 'John Molson School of Business';
  let mockRenderer: any;

  beforeAll(() => {
    class MockDirectionsService {
      route = jasmine.createSpy('route');
    }

    class MockDirectionsRenderer {
      setMap = jasmine.createSpy('setMap');
      setOptions = jasmine.createSpy('setOptions');
      setDirections = jasmine.createSpy('setDirections');
    }

    class MockPlacesService {
      findPlaceFromQuery = jasmine.createSpy('findPlaceFromQuery');
    }

    // Mock LatLng to avoid "not a constructor" errors
    class MockLatLng {
      constructor(private _lat: number, private _lng: number) {}
      lat() {
        return this._lat;
      }
      lng() {
        return this._lng;
      }
    }

    globalThis.google = {
      maps: {
        Map: class {},
        LatLng: MockLatLng,
        places: {
          PlacesService: MockPlacesService,
          PlacesServiceStatus: {
            OK: 'OK',
          },
        },
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
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RouteService],
    });
    service = TestBed.inject(RouteService);

    // Initialize service with a dummy map
    service.initialize({} as google.maps.Map);

    mockRenderer = new google.maps.DirectionsRenderer();
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
              status: google.maps.DirectionsStatus
            ) => void
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
                          start_location: new google.maps.LatLng(45, -73),
                          end_location: new google.maps.LatLng(46, -74),
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
          }
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
              })
            )
            .required(),
          eta: Joi.string().allow(null).required(),
        });

        spyOn(service, 'calculateRoute').and.callThrough();
        const response = await service.generateRoute(origin, destination);
        expect(schema.validate(response).error).toBeUndefined();
      });
    });
  });

  describe('setRouteColor() function', () => {
    describe('given the travel mode is DRIVING', () => {
      it('should return the color red', () => {
        const polylineOptions = service.setRouteColor(
          google.maps.TravelMode.DRIVING,
          mockRenderer
        );
        expect(polylineOptions).toEqual({ strokeColor: 'red' });
      });
    });

    describe('given the travel mode is TRANSIT', () => {
      it('should return the color green', () => {
        const polylineOptions = service.setRouteColor(
          google.maps.TravelMode.TRANSIT,
          mockRenderer
        );
        expect(polylineOptions).toEqual({ strokeColor: 'green' });
      });
    });

    describe('given the travel mode is WALKING', () => {
      it('should return a specific json', () => {
        const polylineOptions = service.setRouteColor(
          google.maps.TravelMode.WALKING,
          mockRenderer
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
});
