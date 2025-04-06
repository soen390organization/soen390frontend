import { AbstractIndoorStrategy } from 'src/app/strategies/indoor-directions/abstract-indoor.strategy';
import { MapData, MapView, Door } from '@mappedin/mappedin-js';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';

class MockMappedinService {
  mapView = {
    Navigation: {
      draw: jasmine.createSpy('draw')
    },
    clear: jasmine.createSpy('clear')
  };

  getMapId = jasmine.createSpy('getMapId');
  getCampusMapData = jasmine.createSpy('getCampusMapData');
}

class TestIndoorStrategy extends AbstractIndoorStrategy {
  getRoutes(origin: MappedInLocation, destination: MappedInLocation) {
    return [];
  }
}

describe('AbstractIndoorStrategy', () => {
  let strategy: TestIndoorStrategy;
  let mockMappedinService: any;

  beforeEach(() => {
    mockMappedinService = new MockMappedinService();
    strategy = new TestIndoorStrategy(mockMappedinService);
  });

  it('should toggle accessibility', () => {
    expect(strategy.isAccessibilityEnabled()).toBeFalse();
    strategy.toggleAccessibility();
    expect(strategy.isAccessibilityEnabled()).toBeTrue();
  });

  it('should return filtered doors from getEntrances', async () => {
    const room: MappedInLocation = { indoorMapId: '123' } as any;
    const mockDoors: Door[] = [{ name: 'Door' } as Door, { name: 'Other' } as Door];

    const mapDataMock: MapData = {
      getByType: jasmine.createSpy('getByType').and.returnValue(mockDoors)
    } as any;

    mockMappedinService.getCampusMapData.and.returnValue({
      '123': { mapData: mapDataMock }
    });

    const result = await strategy.getEntrances(room);
    expect(result?.length).toBe(1);
    expect(result?.[0].name).toBe('Door');
  });

  it('should return null from getEntrances if no room', async () => {
    const consoleSpy = spyOn(console, 'log');
    const result = await strategy.getEntrances(null);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('null!');
  });

  it('should call Navigation.draw with accessible directions if accessibility enabled', async () => {
    strategy.accessibility = true;

    strategy.route = {
      indoorMapId: 'map1',
      directions: ['dir'],
      accessible_directions: ['acc_dir']
    };

    mockMappedinService.getMapId.and.returnValue('map1');

    await strategy.renderRoutes();
    expect(mockMappedinService.mapView.Navigation.draw).toHaveBeenCalledWith(['acc_dir']);
  });

  it('should call Navigation.draw with normal directions if accessibility disabled', async () => {
    strategy.accessibility = false;

    strategy.route = {
      indoorMapId: 'map1',
      directions: ['dir'],
      accessible_directions: ['acc_dir']
    };

    mockMappedinService.getMapId.and.returnValue('map1');

    await strategy.renderRoutes();
    expect(mockMappedinService.mapView.Navigation.draw).toHaveBeenCalledWith(['dir']);
  });

  it('should handle renderRoutes with an array of routes', async () => {
    strategy.accessibility = false;

    strategy.route = [
      {
        indoorMapId: 'map2',
        directions: ['array_dir'],
        accessible_directions: ['array_acc_dir']
      }
    ];

    mockMappedinService.getMapId.and.returnValue('map2');

    await strategy.renderRoutes();
    expect(mockMappedinService.mapView.Navigation.draw).toHaveBeenCalledWith(['array_dir']);
  });

  it('should not call draw if mapId does not match', async () => {
    strategy.route = {
      indoorMapId: 'wrong',
      directions: ['x'],
      accessible_directions: ['y']
    };

    mockMappedinService.getMapId.and.returnValue('correct');

    await strategy.renderRoutes();
    expect(mockMappedinService.mapView.Navigation.draw).not.toHaveBeenCalled();
  });

  it('should call mapView.clear on clearRenderedRoutes', () => {
    strategy.clearRenderedRoutes();
    expect(mockMappedinService.mapView.clear).toHaveBeenCalled();
  });
});
