import { DirectionsService } from './directions.service';
import { TestBed } from '@angular/core/testing';
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
