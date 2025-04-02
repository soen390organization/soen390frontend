// import { OutdoorDrivingStrategy } from './outdoor-driving.strategy';
// import { GoogleMapService } from 'src/app/services/google-map.service';
// import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
// import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';

// describe('OutdoorDrivingStrategy', () => {
//   let strategy: OutdoorDrivingStrategy;
//   let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;
//   let mockMapInstance: any;

//   beforeEach(() => {
//     mockMapInstance = { mock: 'map' };

//     googleMapServiceSpy = jasmine.createSpyObj('GoogleMapService', ['getMap']);
//     googleMapServiceSpy.getMap.and.returnValue(mockMapInstance);

//     strategy = new OutdoorDrivingStrategy(googleMapServiceSpy);
//   });

//   it('should build and assign driving routes using the OutdoorRouteBuilder', async () => {
//     const origin = 'A';
//     const destination = 'B';

//     // Create a valid OutdoorRoute mock
//     const mockRenderer = jasmine.createSpyObj('google.maps.DirectionsRenderer', ['setMap', 'setOptions', 'set']);
//     const mockOutdoorRoute = new OutdoorRoute(origin, destination, google.maps.TravelMode.DRIVING, mockRenderer);
//     spyOn(mockOutdoorRoute, 'getRouteFromGoogle').and.resolveTo(); // Avoid actual async logic

//     const mockRoutes: OutdoorRoute[] = [mockOutdoorRoute];

//     spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
//       return this;
//     });

//     spyOn(OutdoorRouteBuilder.prototype, 'addDrivingRoute').and.callFake(function () {
//       return this;
//     });

//     spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockRoutes));

//     const result = await strategy.getRoutes(origin, destination);

//     expect(OutdoorRouteBuilder.prototype.setMap).toHaveBeenCalledWith(mockMapInstance);
//     expect(OutdoorRouteBuilder.prototype.addDrivingRoute).toHaveBeenCalledWith(origin, destination);
//     expect(OutdoorRouteBuilder.prototype.build).toHaveBeenCalled();
//     expect((strategy as any).routes).toEqual(mockRoutes);
//     expect(result).toBe(strategy);
//   });
// });
