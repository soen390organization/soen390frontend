import { OutdoorRouteBuilder } from './outdoor-route.builder';
import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';

describe('OutdoorRouteBuilder', () => {
  let builder: OutdoorRouteBuilder;
  let mockMap: google.maps.Map;

  beforeEach(() => {
    mockMap = {} as google.maps.Map;
  
    spyOn(OutdoorRoute.prototype, 'getRouteFromGoogle').and.returnValue(Promise.resolve());
  
    // Override the constructor with a real mock class
    (google.maps as any).DirectionsRenderer = MockDirectionsRenderer;
  
    builder = new OutdoorRouteBuilder().setMap(mockMap);
  });  

  it('should add a walking route', () => {
    const origin = 'A';
    const destination = 'B';

    builder.addWalkingRoute(origin, destination);

    expect(builder.routes.length).toBe(1);
    const route = builder.routes[0];
    expect(route.origin).toBe(origin);
    expect(route.destination).toBe(destination);
    expect(route.mode).toBe(google.maps.TravelMode.WALKING);
    expect(route.renderer.map).toBe(mockMap);
    expect(route.renderer.polylineOptions.strokeColor).toBe('#0096FF');
  });

  it('should add a driving route', () => {
    builder.addDrivingRoute('X', 'Y');

    const route = builder.routes[0];
    expect(route.mode).toBe(google.maps.TravelMode.DRIVING);
    expect(route.renderer.polylineOptions.strokeColor).toBe('red');
  });

  it('should add a transit route', () => {
    builder.addTransitRoute('L', 'M');

    const route = builder.routes[0];
    expect(route.mode).toBe(google.maps.TravelMode.TRANSIT);
    expect(route.renderer.polylineOptions.strokeColor).toBe('green');
  });

  it('should build and return OutdoorRoute instances with getRouteFromGoogle called', async () => {
    builder
      .addWalkingRoute('A', 'B')
      .addDrivingRoute('C', 'D');

    const routes = await builder.build();

    expect(routes.length).toBe(2);
    expect(routes[0] instanceof OutdoorRoute).toBeTrue();
    expect(routes[1] instanceof OutdoorRoute).toBeTrue();
    expect(OutdoorRoute.prototype.getRouteFromGoogle).toHaveBeenCalledTimes(2);
  });
});

class MockDirectionsRenderer {
  map: google.maps.Map;
  polylineOptions: google.maps.PolylineOptions;

  constructor(options: google.maps.DirectionsRendererOptions) {
    this.map = options.map!;
    this.polylineOptions = options.polylineOptions!;
  }
}

