import { OutdoorDrivingStrategy } from './outdoor-driving.strategy';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';

describe('OutdoorDrivingStrategy', () => {
  let strategy: OutdoorDrivingStrategy;
  let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;
  let mockMapInstance: any;

  beforeEach(() => {
    mockMapInstance = { mock: 'map' };

    googleMapServiceSpy = jasmine.createSpyObj('GoogleMapService', ['getMap']);
    googleMapServiceSpy.getMap.and.returnValue(mockMapInstance);

    strategy = new OutdoorDrivingStrategy(googleMapServiceSpy);
  });

  it('should build and assign driving routes using the OutdoorRouteBuilder', async () => {
    const origin = 'A';
    const destination = 'B';

    const mockRoutes = [{ mock: 'route' }];

    // Spy on prototype methods BEFORE calling getRoutes()
    const setMapSpy = spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
      return this;
    });

    const addDrivingRouteSpy = spyOn(OutdoorRouteBuilder.prototype, 'addDrivingRoute').and.callFake(function () {
      return this;
    });

    const buildSpy = spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockRoutes));

    const result = await strategy.getRoutes(origin, destination);

    expect(setMapSpy).toHaveBeenCalledWith(mockMapInstance);
    expect(addDrivingRouteSpy).toHaveBeenCalledWith(origin, destination);
    expect(buildSpy).toHaveBeenCalled();
    expect((strategy as any).routes).toEqual(mockRoutes);
    expect(result).toBe(strategy);
  });
});
