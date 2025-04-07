import { OutdoorDrivingStrategy } from './outdoor-driving.strategy';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

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

    // Create a valid OutdoorRoute mock
    const mockRenderer = jasmine.createSpyObj('google.maps.DirectionsRenderer', ['setMap', 'setOptions', 'set']);
    const mockOutdoorRoute = new OutdoorRoute(origin.address, destination.address, google.maps.TravelMode.DRIVING, mockRenderer);
    spyOn(mockOutdoorRoute, 'getRouteFromGoogle').and.resolveTo(); // Avoid actual async logic

    const mockRoutes: OutdoorRoute[] = [mockOutdoorRoute];

    spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
      return this;
    });

    spyOn(OutdoorRouteBuilder.prototype, 'addDrivingRoute').and.callFake(function () {
      return this;
    });

    spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockRoutes));

    const result = await strategy.getRoutes(origin, destination);

    expect(OutdoorRouteBuilder.prototype.setMap).toHaveBeenCalledWith(mockMapInstance);
    expect(OutdoorRouteBuilder.prototype.addDrivingRoute).toHaveBeenCalledWith(origin.address, destination.address);
    expect(OutdoorRouteBuilder.prototype.build).toHaveBeenCalled();
    expect((strategy as any).routes).toEqual(mockRoutes);
    expect(result).toBe(strategy);
  });
});
