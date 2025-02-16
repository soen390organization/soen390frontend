import { DirectionsService } from './directions.service';
import { TestBed } from '@angular/core/testing';

fdescribe('Directions Service', () => {
  let service: DirectionsService;
  let origin =
    '1455 Blvd. De Maisonneuve Ouest, Montreal, Quebec H3G 1M8, Canada';
  let destination = '1450 Guy St, Montreal, Quebec H3H 0A1, Canada';

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
