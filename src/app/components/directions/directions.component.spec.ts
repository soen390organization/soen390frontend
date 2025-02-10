// directions.component.spec.ts
import { DirectionsComponent } from './directions.component';

// Remove any extraneous imports – ensure only DirectionsComponent (and any testing utilities) are imported.

// Declare google so TypeScript knows about it.
declare var google: any;

// Define our mock google object and attach it to the global window.
const mockGoogle = {
  maps: {
    TravelMode: {
      DRIVING: 'DRIVING',
    },
    DirectionsService: class {
      route(request: any, callback: (result: any, status: string) => void): void {
        // For a specific request we simulate ZERO_RESULTS.
        if (request.origin === 'Unknown Location' && request.destination === 'Nowhere') {
          callback(null, 'ZERO_RESULTS');
        } else {
          callback({}, 'OK');
        }
      }
    },
    DirectionsRenderer: class {
      setMap(map: any): void {
        // Dummy implementation – in tests we can spy on this.
      }
      setDirections(response: any): void {
        // Dummy implementation – in tests we can spy on this.
      }
    },
  },
};

// Attach our mockGoogle to the global window so that the component sees it.
(window as any).google = mockGoogle;

describe('DirectionsComponent', () => {
  let component: DirectionsComponent;

  beforeEach(() => {
    // Create the component instance.
    component = new DirectionsComponent();
    // Manually set our directionsService and directionsRenderer using the global google object.
    (component as any).directionsService = new google.maps.DirectionsService();
    (component as any).directionsRenderer = new google.maps.DirectionsRenderer();
  });

  describe('ngOnInit', () => {
    it('should initialize directionsService and directionsRenderer', () => {
      const comp = new DirectionsComponent();
      comp.ngOnInit();
      expect((comp as any).directionsService).toBeDefined();
      expect((comp as any).directionsRenderer).toBeDefined();
    });
  });

  describe('calculateRoute', () => {
    const validMap = {} as any; // a dummy map object

    it('should log an error and return for invalid input (null addresses)', () => {
      spyOn(console, 'error');
      component.calculateRoute(validMap, null as any, null as any);
      expect(console.error).toHaveBeenCalledWith('Directions request failed due to ', 'INVALID_INPUT');
    });

    it('should bind the map and update directions when status is OK', () => {
      // Spy on the renderer methods.
      spyOn((component as any).directionsRenderer, 'setMap');
      spyOn((component as any).directionsRenderer, 'setDirections');

      component.calculateRoute(validMap, 'New York, NY', 'Philadelphia, PA');

      expect((component as any).directionsRenderer.setMap).toHaveBeenCalledWith(validMap);
      expect((component as any).directionsRenderer.setDirections).toHaveBeenCalled();
    });

    it('should log an error when ZERO_RESULTS is returned', () => {
      spyOn(console, 'error');

      component.calculateRoute(validMap, 'Unknown Location', 'Nowhere');

      expect(console.error).toHaveBeenCalledWith('Directions request failed due to', 'ZERO_RESULTS');
    });

    it('should log an error for an unexpected status', () => {
      // Override directionsService to simulate an unexpected status.
      (component as any).directionsService = {
        route: (request: any, callback: (response: any, status: string) => void) => {
          callback(null, 'NOT_FOUND');
        },
      };
      spyOn(console, 'error');

      component.calculateRoute(validMap, 'Somewhere', 'Anywhere');

      expect(console.error).toHaveBeenCalledWith('Directions request failed due to ', 'NOT_FOUND');
    });

    it('should create a new directionsRenderer if one is not already initialized', () => {
      // Create a new component instance that does not pre-set directionsRenderer.
      component = new DirectionsComponent();
      (component as any).directionsService = new google.maps.DirectionsService();
      // Do not set directionsRenderer so calculateRoute should create one.
      // Spy on the global DirectionsRenderer constructor.
      spyOn(google.maps, 'DirectionsRenderer').and.callThrough();

      component.calculateRoute(validMap, 'New York, NY', 'Philadelphia, PA');

      expect(google.maps.DirectionsRenderer).toHaveBeenCalled();
      expect((component as any).directionsRenderer).toBeDefined();
    });
  });
});
