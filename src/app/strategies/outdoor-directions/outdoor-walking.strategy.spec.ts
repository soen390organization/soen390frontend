import { OutdoorWalkingStrategy } from './outdoor-walking.strategy';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

describe('OutdoorWalkingStrategy', () => {
  let strategy: OutdoorWalkingStrategy;
  let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;
  let mockMapInstance: any;

  beforeEach(() => {
    mockMapInstance = { mock: 'map' };

    googleMapServiceSpy = jasmine.createSpyObj('GoogleMapService', ['getMap']);
    googleMapServiceSpy.getMap.and.returnValue(mockMapInstance);

    strategy = new OutdoorWalkingStrategy(googleMapServiceSpy);
  });

  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });

  it('should build and assign walking routes using the OutdoorRouteBuilder', async () => {
    const origin: GoogleMapLocation = {
      title: 'Test A',
      address: 'Boul. Test',
      type: 'outdoor',
      coordinates: new google.maps.LatLng(0, 0)
    };
    const destination: GoogleMapLocation = {
      title: 'Test B',
      address: 'Test Ave',
      type: 'outdoor',
      coordinates: new google.maps.LatLng(1, 1)
    };

    // Create a valid OutdoorRoute instance
    const mockRenderer = jasmine.createSpyObj('google.maps.DirectionsRenderer', ['setMap', 'setOptions', 'set']);
    const mockOutdoorRoute = new OutdoorRoute(origin.address, destination.address, google.maps.TravelMode.WALKING, mockRenderer);
    spyOn(mockOutdoorRoute, 'getRouteFromGoogle').and.resolveTo(); // Stub async method

    const mockRoutes: OutdoorRoute[] = [mockOutdoorRoute];

    const setMapSpy = spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
      return this;
    });

    const addWalkingRouteSpy = spyOn(OutdoorRouteBuilder.prototype, 'addWalkingRoute').and.callFake(function () {
      return this;
    });

    const buildSpy = spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockRoutes));

    const result = await strategy.getRoutes(origin, destination);

    expect(setMapSpy).toHaveBeenCalledWith(mockMapInstance);
    expect(addWalkingRouteSpy).toHaveBeenCalledWith(origin.address, destination.address);
    expect(buildSpy).toHaveBeenCalled();
    expect((strategy as any).routes).toEqual(mockRoutes);
    expect(result).toBe(strategy);
  });
});
