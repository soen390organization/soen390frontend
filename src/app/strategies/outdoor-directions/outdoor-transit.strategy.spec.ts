import { OutdoorTransitStrategy } from './outdoor-transit.strategy';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';

describe('OutdoorTransitStrategy', () => {
  let strategy: OutdoorTransitStrategy;
  let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;
  let mockMapInstance: any;

  beforeEach(() => {
    mockMapInstance = { mock: 'map' };

    googleMapServiceSpy = jasmine.createSpyObj('GoogleMapService', ['getMap']);
    googleMapServiceSpy.getMap.and.returnValue(mockMapInstance);

    strategy = new OutdoorTransitStrategy(googleMapServiceSpy);
  });

  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });

  it('should build and assign transit routes using the OutdoorRouteBuilder', async () => {
    const origin = 'Station A';
    const destination = 'Station B';

    // Create a valid OutdoorRoute mock
    const mockRenderer = jasmine.createSpyObj('google.maps.DirectionsRenderer', ['setMap', 'setOptions', 'set']);
    const mockOutdoorRoute = new OutdoorRoute(origin, destination, google.maps.TravelMode.TRANSIT, mockRenderer);
    spyOn(mockOutdoorRoute, 'getRouteFromGoogle').and.resolveTo(); // stub the async call

    const mockRoutes: OutdoorRoute[] = [mockOutdoorRoute];

    const setMapSpy = spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
      return this;
    });

    const addTransitRouteSpy = spyOn(OutdoorRouteBuilder.prototype, 'addTransitRoute').and.callFake(function () {
      return this;
    });

    const buildSpy = spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockRoutes));

    const result = await strategy.getRoutes(origin, destination);

    expect(setMapSpy).toHaveBeenCalledWith(mockMapInstance);
    expect(addTransitRouteSpy).toHaveBeenCalledWith(origin, destination);
    expect(buildSpy).toHaveBeenCalled();
    expect((strategy as any).routes).toEqual(mockRoutes);
    expect(result).toBe(strategy);
  });
});
