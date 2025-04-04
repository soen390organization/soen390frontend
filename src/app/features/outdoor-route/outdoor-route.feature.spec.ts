import { OutdoorRoute } from './outdoor-route.feature';

describe('OutdoorRoute', () => {
  let origin: string;
  let destination: string;
  let travelMode: google.maps.TravelMode;
  let renderer: google.maps.DirectionsRenderer;
  let outdoorRoute: OutdoorRoute;

  let mockResponse: google.maps.DirectionsResult;

  beforeEach(() => {
    origin = 'Start Point';
    destination = 'End Point';
    travelMode = google.maps.TravelMode.WALKING;
    renderer = {} as google.maps.DirectionsRenderer;

    outdoorRoute = new OutdoorRoute(origin, destination, travelMode, renderer);

    mockResponse = {
      routes: [],
      geocoded_waypoints: [],
      request: {
        origin,
        destination,
        travelMode,
      } as google.maps.DirectionsRequest,
    };

    // ✅ Properly mock DirectionsService as a constructor
    const mockConstructor = function (this: any) {
      this.route = (
        request: google.maps.DirectionsRequest,
        callback: (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => void
      ) => {
        callback(mockResponse, google.maps.DirectionsStatus.OK);
      };
    };

    // @ts-ignore override the constructor
    spyOn(google.maps, 'DirectionsService').and.callFake(mockConstructor);
  });

  it('should return origin', () => {
    expect(outdoorRoute.getOrigin()).toBe(origin);
  });

  it('should return destination', () => {
    expect(outdoorRoute.getDestination()).toBe(destination);
  });

  it('should return travelMode', () => {
    expect(outdoorRoute.getTravelMode()).toBe(travelMode);
  });

  it('should return renderer', () => {
    expect(outdoorRoute.getRenderer()).toBe(renderer);
  });

  it('should initially return null for response', () => {
    expect(outdoorRoute.getResponse()).toBeNull();
  });

  it('should fetch and store directions result from Google on success', async () => {
    await outdoorRoute.getRouteFromGoogle();
    expect(outdoorRoute.getResponse()).toEqual(mockResponse);
  });

  it('should throw an error if Google Maps API returns a failure status', async () => {
    // 🔁 Override the constructor again with failure behavior
    const mockFailureConstructor = function (this: any) {
      this.route = (
        request: google.maps.DirectionsRequest,
        callback: (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => void
      ) => {
        callback(null, google.maps.DirectionsStatus.NOT_FOUND);
      };
    };

    // @ts-ignore override again
    (google.maps.DirectionsService as jasmine.Spy).and.callFake(mockFailureConstructor);

    await expectAsync(outdoorRoute.getRouteFromGoogle()).toBeRejectedWithError(google.maps.DirectionsStatus.NOT_FOUND);
    expect(outdoorRoute.getResponse()).toBeNull();
  });
});
