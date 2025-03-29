import { OutdoorShuttleStrategy } from './outdoor-shuttle.strategy';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { ShuttleDataService } from 'src/app/services/shuttle-data/shuttle-data.service';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';

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

  const mockCampus: any = {
    name: 'SGW',
    abbreviation: 'sgw',
    address: '123 SGW St',
    coordinates: { lat: 1, lng: 2 },
    shuttleBus: {
      terminal: { lat: 1, lng: 2 },
      schedule: []
    },
    buildings: []
  };

  const otherCampus = {
    ...mockCampus,
    name: 'LOY',
    abbreviation: 'loy',
    address: '456 LOY Ave'
  };
  
  beforeEach(() => {
    mockMap = { mock: 'map' };
  
    googleMapServiceSpy = jasmine.createSpyObj<GoogleMapService>(
      'GoogleMapService',
      ['getCoordsFromAddress', 'getMap']
    );
  
    // ✅ Keep the correct type
    concordiaDataServiceSpy = jasmine.createSpyObj<ConcordiaDataService>(
      'ConcordiaDataService',
      ['getNearestCampus']
    );
  
    shuttleDataServiceSpy = jasmine.createSpyObj<ShuttleDataService>(
      'ShuttleDataService',
      ['getNextBus']
    );
  
    googleMapServiceSpy.getMap.and.returnValue(mockMap);
  
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

    const mockBuiltRoutes = [
      { response: {} }, // Walking route 1
      {
        response: {
          routes: [{
            legs: [{
              steps: [
                { instructions: 'Original instruction' },
                { instructions: 'Another instruction', hide: false }
              ]
            }]
          }]
        }
      },
      { response: {} } // Walking route 2
    ];

    spyOn(OutdoorRouteBuilder.prototype, 'setMap').and.callFake(function () {
      return this;
    });

    spyOn(OutdoorRouteBuilder.prototype, 'addWalkingRoute').and.callFake(function () {
      return this;
    });

    spyOn(OutdoorRouteBuilder.prototype, 'addDrivingRoute').and.callFake(function () {
      return this;
    });

    spyOn(OutdoorRouteBuilder.prototype, 'build').and.returnValue(Promise.resolve(mockBuiltRoutes));

    const result = await strategy.getRoutes('Origin', 'Destination');
    const drivingSteps = mockBuiltRoutes[1].response.routes[0].legs[0].steps;

    expect(drivingSteps[0].instructions).toContain(`Next shuttle at ${nextBusTime}`);
    expect(drivingSteps[1].hide).toBeTrue();
    expect(result).toBe(strategy);
    expect((strategy as any).routes).toEqual(mockBuiltRoutes);
  });
});
