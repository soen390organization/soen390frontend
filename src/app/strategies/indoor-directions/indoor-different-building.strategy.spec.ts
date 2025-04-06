import { IndoorDifferentBuildingStrategy } from './indoor-different-building.strategy';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';

describe('IndoorDifferentBuildingStrategy', () => {
  let strategy: IndoorDifferentBuildingStrategy;
  let mappedinServiceMock: jasmine.SpyObj<MappedinService>;
  let fakeStartMapData: any;
  let fakeDestMapData: any;

  beforeEach(() => {
    fakeStartMapData = {
      getDirections: jasmine.createSpy('getDirections').and.returnValue(['startPath'])
    };

    fakeDestMapData = {
      getDirections: jasmine.createSpy('getDirections').and.returnValue(['destPath'])
    };

    mappedinServiceMock = jasmine.createSpyObj('MappedinService', ['getCampusMapData']);
    strategy = new IndoorDifferentBuildingStrategy(mappedinServiceMock);

    // Stub getEntrances for strategy
    spyOn(strategy as any, 'getEntrances').and.callFake(async (location: MappedInLocation) => {
      return location.room === 'startRoom' ? 'startEntrance' : 'destEntrance';
    });
  });

  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });

  it('should compute multi-building routes correctly', async () => {
    const startPoint: MappedInLocation = {
      indoorMapId: 'buildingA',
      room: 'startRoom'
    } as any;

    const destPoint: MappedInLocation = {
      indoorMapId: 'buildingB',
      room: 'destRoom'
    } as any;

    mappedinServiceMock.getCampusMapData.and.returnValue({
      buildingA: { mapData: fakeStartMapData },
      buildingB: { mapData: fakeDestMapData }
    });

    const result = await strategy.getRoutes(startPoint, destPoint);

    // Assertions
    expect((strategy as any).getEntrances).toHaveBeenCalledWith(startPoint);
    expect((strategy as any).getEntrances).toHaveBeenCalledWith(destPoint);

    expect(fakeStartMapData.getDirections).toHaveBeenCalledWith('startRoom', 'startEntrance');
    expect(fakeStartMapData.getDirections).toHaveBeenCalledWith('startRoom', 'startEntrance', {
      accessible: true
    });

    expect(fakeDestMapData.getDirections).toHaveBeenCalledWith('destEntrance', 'destRoom');
    expect(fakeDestMapData.getDirections).toHaveBeenCalledWith('destEntrance', 'destRoom', {
      accessible: true
    });

    expect(result).toBe(strategy);
    const routes = strategy.route as any[];
    expect(routes.length).toBe(2);
    expect(routes[0].indoorMapId).toBe('buildingA');
    expect(routes[1].indoorMapId).toBe('buildingB');
  });

  it('should handle missing mapData gracefully (undefined)', async () => {
    mappedinServiceMock.getCampusMapData.and.returnValue({
      buildingA: { mapData: undefined },
      buildingB: { mapData: undefined }
    });

    const startPoint = { indoorMapId: 'buildingA', room: 'startRoom' } as any;
    const destPoint = { indoorMapId: 'buildingB', room: 'destRoom' } as any;

    const result = await strategy.getRoutes(startPoint, destPoint);

    expect(result).toBe(strategy);
    expect(strategy.route).toEqual([
      {
        indoorMapId: 'buildingA',
        directions: undefined,
        accessible_directions: undefined
      },
      {
        indoorMapId: 'buildingB',
        directions: undefined,
        accessible_directions: undefined
      }
    ]);
  });
});
