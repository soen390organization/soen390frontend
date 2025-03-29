import { OutdoorShuttleStrategy } from './outdoor-shuttle.strategy';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { ShuttleDataService } from 'src/app/services/shuttle-data/shuttle-data.service';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
import { OutdoorRoute } from 'src/app/features/outdoor-route/outdoor-route.feature';
import data from 'src/assets/concordia-data.json';
import { Campus } from 'src/app/services/concordia-data.service';

describe('OutdoorShuttleStrategy', () => {
  let strategy: OutdoorShuttleStrategy;
  let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;
  let concordiaDataServiceSpy: jasmine.SpyObj<ConcordiaDataService>;
  let shuttleDataServiceSpy: jasmine.SpyObj<ShuttleDataService>;
  let mockMap: any;

  const fakeLatLng = {
    lat: () => 1,
    lng: () => 2,
    equals: () => false,
    toJSON: () => ({ lat: 1, lng: 2 }),
    toUrlValue: () => '1,2',
    toString: () => 'LatLng(1,2)'
  } as unknown as google.maps.LatLng;

  const mockCampus: Campus = { ...data.sgw };
  const otherCampus: Campus = {
    ...mockCampus,
    name: 'LOY',
    abbreviation: 'loy',
    address: '456 LOY Ave'
  };

  beforeEach(() => {
    mockMap = { mock: 'map' };

    googleMapServiceSpy = jasmine.createSpyObj('GoogleMapService', ['getCoordsFromAddress', 'getMap']);
    googleMapServiceSpy.getMap.and.returnValue(mockMap);

    concordiaDataServiceSpy = jasmine.createSpyObj('ConcordiaDataService', ['getNearestCampus']);
    shuttleDataServiceSpy = jasmine.createSpyObj('ShuttleDataService', ['getNextBus']);

    strategy = new OutdoorShuttleStrategy(
      shuttleDataServiceSpy,
      concordiaDataServiceSpy,
      googleMapServiceSpy
    );
  });

  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });

  // it('should return null if campuses are the same', async () => {
  //   googleMapServiceSpy.getCoordsFromAddress.and.resolveTo(fakeLatLng);
  //   concordiaDataServiceSpy.getNearestCampus.and.resolveTo(mockCampus);

  //   const result = await strategy.getRoutes('Origin', 'Destination');
  //   expect(result).toBeNull();
  // });

  it('should return null if no next shuttle bus is found', async () => {
    googleMapServiceSpy.getCoordsFromAddress.and.resolveTo(fakeLatLng);
    concordiaDataServiceSpy.getNearestCampus.withArgs(fakeLatLng).and.returnValues(mockCampus, otherCampus);
    shuttleDataServiceSpy.getNextBus.and.returnValue(null);

    const result = await strategy.getRoutes('Origin', 'Destination');
    expect(result).toBeNull();
  });

  it('should build the route and modify the driving step instructions', async () => {
    const nextBusTime = '12:30 PM';

    googleMapServiceSpy.getCoordsFromAddress.and.resolveTo(fakeLatLng);
    concordiaDataServiceSpy.getNearestCampus.withArgs(fakeLatLng).and.returnValues(mockCampus, otherCampus);
    shuttleDataServiceSpy.getNextBus.and.returnValue(nextBusTime);

    // Create mock renderer
    const mockRenderer = jasmine.createSpyObj('google.maps.DirectionsRenderer', ['setMap', 'setOptions', 'set']);

    // Mock OutdoorRoute instances
    const walkingRoute1 = new OutdoorRoute('A', 'B', google.maps.TravelMode.WALKING, mockRenderer);
    const drivingRoute = new OutdoorRoute('B', 'C', google.maps.TravelMode.DRIVING, mockRenderer);
    const walkingRoute2 = new OutdoorRoute('C', 'D', google.maps.TravelMode.WALKING, mockRenderer);

    const drivingResponse = {
      routes: [{
        legs: [{
          steps: [
            { instructions: 'Original instruction' },
            { instructions: 'Another instruction', hide: false }
          ]
        }]
      }]
    } as google.maps.DirectionsResult;

    spyOn(walkingRoute1, 'getRouteFromGoogle').and.resolveTo();
    spyOn(drivingRoute, 'getRouteFromGoogle').and.resolveTo();
    spyOn(walkingRoute2, 'getRouteFromGoogle').and.resolveTo();

    spyOn(walkingRoute1, 'getResponse').and.returnValue({} as google.maps.DirectionsResult);
    spyOn(drivingRoute, 'getResponse').and.returnValue(drivingResponse);
    spyOn(walkingRoute2, 'getResponse').and.returnValue({} as google.maps.DirectionsResult);

    const mockRoutes: OutdoorRoute[] = [walkingRoute1, drivingRoute, walkingRoute2];

    spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
      return this;
    });
    spyOn(OutdoorRouteBuilder.prototype, 'addWalkingRoute').and.callFake(function () {
      return this;
    });
    spyOn(OutdoorRouteBuilder.prototype, 'addDrivingRoute').and.callFake(function () {
      return this;
    });
    spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockRoutes));

    const result = await strategy.getRoutes('Origin', 'Destination');
    const drivingSteps = drivingRoute.getResponse().routes[0].legs[0].steps;

    expect(drivingSteps[0].instructions).toContain(`Next shuttle at ${nextBusTime}`);
    // expect(drivingSteps[1].hide).toBeTrue();
    expect(result).toBe(strategy);
    expect((strategy as any).routes).toEqual(mockRoutes);
  });
});
