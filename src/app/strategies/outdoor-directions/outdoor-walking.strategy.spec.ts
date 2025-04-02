// import { OutdoorWalkingStrategy } from './outdoor-walking.strategy';
// import { GoogleMapService } from 'src/app/services/google-map.service';
// import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
// import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';

// describe('OutdoorWalkingStrategy', () => {
//   let strategy: OutdoorWalkingStrategy;
//   let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;
//   let mockMapInstance: any;

//   beforeEach(() => {
//     mockMapInstance = { mock: 'map' };

//     googleMapServiceSpy = jasmine.createSpyObj('GoogleMapService', ['getMap']);
//     googleMapServiceSpy.getMap.and.returnValue(mockMapInstance);

//     strategy = new OutdoorWalkingStrategy(googleMapServiceSpy);
//   });

//   it('should be created', () => {
//     expect(strategy).toBeTruthy();
//   });

//   it('should build and assign walking routes using the OutdoorRouteBuilder', async () => {
//     const origin = 'Park Entrance';
//     const destination = 'Trail End';

//     // Create a valid OutdoorRoute instance
//     const mockRenderer = jasmine.createSpyObj('google.maps.DirectionsRenderer', ['setMap', 'setOptions', 'set']);
//     const mockOutdoorRoute = new OutdoorRoute(origin, destination, google.maps.TravelMode.WALKING, mockRenderer);
//     spyOn(mockOutdoorRoute, 'getRouteFromGoogle').and.resolveTo(); // Stub async method

//     const mockRoutes: OutdoorRoute[] = [mockOutdoorRoute];

//     const setMapSpy = spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
//       return this;
//     });

//     const addWalkingRouteSpy = spyOn(OutdoorRouteBuilder.prototype, 'addWalkingRoute').and.callFake(function () {
//       return this;
//     });

//     const buildSpy = spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockRoutes));

//     const result = await strategy.getRoutes(origin, destination);

//     expect(setMapSpy).toHaveBeenCalledWith(mockMapInstance);
//     expect(addWalkingRouteSpy).toHaveBeenCalledWith(origin, destination);
//     expect(buildSpy).toHaveBeenCalled();
//     expect((strategy as any).routes).toEqual(mockRoutes);
//     expect(result).toBe(strategy);
//   });
// });
