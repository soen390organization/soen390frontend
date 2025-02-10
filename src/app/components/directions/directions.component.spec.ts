import { DirectionsComponent } from './directions.component';

declare var google: any;

describe('DirectionsComponent', () => {
  let component: DirectionsComponent;
  const validMap = {} as any;

  beforeAll(() => {
    (window as any).google = {
      maps: {
        TravelMode: {
          DRIVING: 'DRIVING',
        },
        DirectionsService: class {
          route(request: any, callback: (result: any, status: string) => void): void {
            if (request.origin === 'Unknown Location' && request.destination === 'Nowhere') {
              callback(null, 'ZERO_RESULTS');
            } else {
              callback({}, 'OK');
            }
          }
        },
        DirectionsRenderer: class {
          setMap(map: any): void {}
          setDirections(response: any): void {}
        },
      },
    };
  });

  beforeEach(() => {
    component = new DirectionsComponent();
    (component as any).directionsService = new google.maps.DirectionsService();
    (component as any).directionsRenderer = new google.maps.DirectionsRenderer();
  });

  describe('ngOnInit', () => {
    it('should initialize directionsService and directionsRenderer', () => {
      component.ngOnInit();
      expect((component as any).directionsService).toBeDefined();
      expect((component as any).directionsRenderer).toBeDefined();
    });

    it('should initialize directionsService and directionsRenderer with correct instances', () => {
      component.ngOnInit();
      expect((component as any).directionsService).toBeInstanceOf(google.maps.DirectionsService);
      expect((component as any).directionsRenderer).toBeInstanceOf(google.maps.DirectionsRenderer);
    });
  });

  describe('DirectionsComponent Constructor', () => {
    it('should create an instance of DirectionsComponent', () => {
      expect(component).toBeTruthy();
    });

    it('should have undefined directionsService and directionsRenderer before ngOnInit is called', () => {
      const newComponent = new DirectionsComponent();
      expect(newComponent['directionsService']).toBeUndefined();
      expect(newComponent['directionsRenderer']).toBeUndefined();
    });
  });

  describe('calculateRoute', () => {
    it('should log an error and return for invalid input (null addresses)', () => {
      spyOn(console, 'error');
      component.calculateRoute(validMap, null as any, null as any);
      expect(console.error).toHaveBeenCalledWith('Directions request failed due to ', 'INVALID_INPUT');
    });

    it('should log an error and return for empty addresses', () => {
      spyOn(console, 'error');
      component.calculateRoute(validMap, '', '');
      expect(console.error).toHaveBeenCalledWith('Directions request failed due to ', 'INVALID_INPUT');
    });

    it('should log an error and return for invalid map input', () => {
      spyOn(console, 'error');
      component.calculateRoute(null as any, 'New York, NY', 'Philadelphia, PA');
      expect(console.error).toHaveBeenCalledWith('Directions request failed due to ', 'INVALID_INPUT');
    });

    it('should bind the map and update directions when status is OK', () => {
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
      component = new DirectionsComponent();
      (component as any).directionsService = new google.maps.DirectionsService();
      spyOn(google.maps, 'DirectionsRenderer').and.callThrough();

      component.calculateRoute(validMap, 'New York, NY', 'Philadelphia, PA');

      expect(google.maps.DirectionsRenderer).toHaveBeenCalled();
      expect((component as any).directionsRenderer).toBeDefined();
    });
  });
});
