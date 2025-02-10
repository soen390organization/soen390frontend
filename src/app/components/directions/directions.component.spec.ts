// directions.component.spec.ts
import { DirectionsComponent } from './directions.component';

// Remove any extraneous imports that reference non-existent modules.

// Tell TypeScript that our tests will attach a mock to window.google.
declare var window: any;

// Create a comprehensive mock for google.maps.
const mockGoogle = {
  maps: {
    TravelMode: {
      DRIVING: 'DRIVING'
    },
    DirectionsService: class {
      route(request: any, callback: (response: any, status: string) => void): void {
        // Simulate ZERO_RESULTS when the origin is 'Unknown Location' and destination is 'Nowhere'
        if (request.origin === 'Unknown Location' && request.destination === 'Nowhere') {
          callback(null, 'ZERO_RESULTS');
        }
        // Simulate an unexpected status when origin is 'Somewhere' and destination is 'Anywhere'
        else if (request.origin === 'Somewhere' && request.destination === 'Anywhere') {
          callback(null, 'NOT_FOUND');
        }
        // Simulate a response with status OK but a null response when origin is 'NoResponse'
        else if (request.origin === 'NoResponse' && request.destination === 'OK') {
          callback(null, 'OK');
        }
        // Otherwise, simulate a successful OK response with a dummy result.
        else {
          callback({ route: 'testRoute' }, 'OK');
        }
      }
    },
    DirectionsRenderer: class {
      setMap(map: any): void {
        // (Empty; will be spied on.)
      }
      setDirections(response: any): void {
        // (Empty; will be spied on.)
      }
    }
  }
};

// Attach our mock to window so the component finds it.
window.google = mockGoogle;

describe('DirectionsComponent', () => {
  let component: DirectionsComponent;
  const dummyMap = {} as any; // a dummy map object

  beforeEach(() => {
    // Create a fresh instance of the component.
    component = new DirectionsComponent();
    // Manually set the services using our mock.
    (component as any).directionsService = new google.maps.DirectionsService();
    (component as any).directionsRenderer = new google.maps.DirectionsRenderer();
  });

  it('ngOnInit should initialize directionsService and directionsRenderer', () => {
    const comp = new DirectionsComponent();
    comp.ngOnInit();
    expect((comp as any).directionsService).toBeDefined();
    expect((comp as any).directionsRenderer).toBeDefined();
  });

  it('should log error and return for invalid input (null or empty addresses)', () => {
    spyOn(console, 'error');
    // Passing empty strings (falsy) for start and destination.
    component.calculateRoute(dummyMap, '', '');
    expect(console.error).toHaveBeenCalledWith(
      'Directions request failed due to ', 'INVALID_INPUT'
    );
  });

  it('should call setMap and setDirections for valid input with OK response', () => {
    // Spy on the renderer methods.
    const setMapSpy = spyOn((component as any).directionsRenderer, 'setMap');
    const setDirectionsSpy = spyOn((component as any).directionsRenderer, 'setDirections');
    component.calculateRoute(dummyMap, 'New York, NY', 'Philadelphia, PA');
    expect(setMapSpy).toHaveBeenCalledWith(dummyMap);
    expect(setDirectionsSpy).toHaveBeenCalledWith(jasmine.any(Object));
  });

  it('should log error when ZERO_RESULTS is returned', () => {
    spyOn(console, 'error');
    component.calculateRoute(dummyMap, 'Unknown Location', 'Nowhere');
    expect(console.error).toHaveBeenCalledWith(
      'Directions request failed due to', 'ZERO_RESULTS'
    );
  });

  it('should log error for an unexpected status (e.g., NOT_FOUND)', () => {
    spyOn(console, 'error');
    component.calculateRoute(dummyMap, 'Somewhere', 'Anywhere');
    expect(console.error).toHaveBeenCalledWith(
      'Directions request failed due to ', 'NOT_FOUND'
    );
  });

  it('should log error when status is OK but response is null', () => {
    spyOn(console, 'error');
    component.calculateRoute(dummyMap, 'NoResponse', 'OK');
    // Since the response is null, the else branch is executed and logs the status ("OK")
    expect(console.error).toHaveBeenCalledWith(
      'Directions request failed due to ', 'OK'
    );
  });

  it('should instantiate a new directionsRenderer if one is not already initialized', () => {
    // Create a new component instance that does not have a renderer.
    component = new DirectionsComponent();
    (component as any).directionsService = new google.maps.DirectionsService();
    // Set directionsRenderer to undefined so that calculateRoute creates one.
    (component as any).directionsRenderer = undefined;
    // Spy on the global DirectionsRenderer constructor.
    spyOn(google.maps, 'DirectionsRenderer').and.callThrough();
    component.calculateRoute(dummyMap, 'New York, NY', 'Philadelphia, PA');
    expect(google.maps.DirectionsRenderer).toHaveBeenCalled();
    expect((component as any).directionsRenderer).toBeDefined();
  });

  it('should call route with proper travelMode DRIVING', () => {
    // Spy on the route method and capture its arguments.
    const routeSpy = spyOn((component as any).directionsService, 'route').and.callThrough();
    component.calculateRoute(dummyMap, 'A', 'B');
    expect(routeSpy).toHaveBeenCalled();
    const requestArg = routeSpy.calls.mostRecent().args[0] as any;
    expect(requestArg.travelMode).toBe('DRIVING');
  });
});
