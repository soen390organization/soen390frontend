import { DirectionsService } from './directions.service';
import { TestBed } from '@angular/core/testing';
import Joi from 'joi';

describe('Directions Service', () => {
  let service: DirectionsService;
  let origin = 'Hall Building Concordia';
  let destination = 'John Molson School of Business';

  beforeAll(() => {
    class MockDirectionsService {
      route = jasmine.createSpy('route');
    }

    class MockDirectionsRenderer {
      setMap = jasmine.createSpy('setMap');
      setOptions = jasmine.createSpy('setOptions');
      setDirections = jasmine.createSpy('setDirections');
    }

    globalThis.google = {
      maps: {
        DirectionsService: MockDirectionsService,
        DirectionsRenderer: MockDirectionsRenderer,
        TravelMode: {
          DRIVING: 'DRIVING',
          TRANSIT: 'TRANSIT',
          WALKING: 'WALKING',
        },
        DirectionsStatus: {
          OK: 'OK', // <-- Define this to fix the issue
        },

        SymbolPath: { CIRCLE: 'CIRCLE' },
      },
    } as any;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DirectionsService],
    });
    service = TestBed.inject(DirectionsService);
    service.initialize({} as google.maps.Map);
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
        const response = await service.generateRoute(origin, destination);
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
});
