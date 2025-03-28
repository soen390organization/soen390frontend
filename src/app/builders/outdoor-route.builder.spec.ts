import { OutdoorRouteBuilder } from './outdoor-route.builder';

describe('OutdoorRouteBuilder', () => {
  let service: OutdoorRouteBuilder;
  let mockMap: any;

  // Mocks
  const mockSetMap = jasmine.createSpy('setMap');
  const mockSetOptions = jasmine.createSpy('setOptions');
  const mockDirectionsRenderer = jasmine.createSpyObj('DirectionsRenderer', ['setMap', 'setOptions']);
  const mockRouteFn = jasmine.createSpy();

  beforeEach(() => {
    // Mock google.maps objects
    (globalThis as any).google = {
      maps: {
        Map: class {},
        DirectionsRenderer: function () {
          return mockDirectionsRenderer;
        },
        DirectionsService: function () {
          return { route: mockRouteFn };
        },
        DirectionsStatus: {
          OK: 'OK'
        },
        TravelMode: {
          WALKING: 'WALKING',
          DRIVING: 'DRIVING',
          TRANSIT: 'TRANSIT'
        },
        SymbolPath: {
          CIRCLE: 'CIRCLE'
        }
      }
    };

    service = new OutdoorRouteBuilder();
    mockMap = jasmine.createSpyObj('Map', ['setCenter']);
  });

  it('should set the map and return itself', () => {
    const result = service.setMap(mockMap);
    expect(result).toBe(service);
    expect(service.map).toBe(mockMap);
  });

  it('should add a walking route and return itself', () => {
    service.setMap(mockMap);
    const result = service.addWalkingRoute('A', 'B');
    expect(result).toBe(service);
    expect(service.routes.length).toBe(1);
    expect(service.routes[0].mode).toBe(google.maps.TravelMode.WALKING);
  });

  it('should add a driving route and return itself', () => {
    service.setMap(mockMap);
    const result = service.addDrivingRoute('C', 'D');
    expect(result).toBe(service);
    expect(service.routes.length).toBe(1);
    expect(service.routes[0].mode).toBe(google.maps.TravelMode.DRIVING);
  });

  it('should add a transit route and return itself', () => {
    service.setMap(mockMap);
    const result = service.addTransitRoute('E', 'F');
    expect(result).toBe(service);
    expect(service.routes.length).toBe(1);
    expect(service.routes[0].mode).toBe(google.maps.TravelMode.TRANSIT);
  });

  it('should resolve with directions result in build()', async () => {
    const mockResponse = { directions: 'mock' };
    mockRouteFn.and.callFake((request, callback) => {
      callback(mockResponse, 'OK');
    });

    service.setMap(mockMap);
    service.addDrivingRoute('G', 'H');
    const result = await service.build();

    expect(result.length).toBe(1);
    expect(result[0].origin).toBe('G');
    expect(result[0].destination).toBe('H');
    expect(result[0].response).toEqual(mockResponse);
  });

  it('should reject when directions status is not OK', async () => {
    mockRouteFn.and.callFake((request, callback) => {
      callback(null, 'ERROR');
    });

    service.setMap(mockMap);
    service.addTransitRoute('X', 'Y');

    await expectAsync(service.build()).toBeRejectedWithError('ERROR');
  });
});
