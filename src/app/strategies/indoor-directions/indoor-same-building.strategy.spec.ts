import { IndoorSameBuildingStrategy } from './indoor-same-building.strategy';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';

describe('IndoorSameBuildingStrategy', () => {
  let strategy: IndoorSameBuildingStrategy;
  let mappedinServiceMock: jasmine.SpyObj<MappedinService>;
  let fakeMapData: any;

  beforeEach(() => {
    fakeMapData = {
      getDirections: jasmine.createSpy('getDirections').and.callFake((start, end, options?) => {
        return options?.accessible ? ['accessible path'] : ['regular path'];
      })
    };

    mappedinServiceMock = jasmine.createSpyObj('MappedinService', ['getCampusMapData']);
    strategy = new IndoorSameBuildingStrategy(mappedinServiceMock);
  });

  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });

  it('should return null if mapData is missing', async () => {
    mappedinServiceMock.getCampusMapData.and.returnValue({
      buildingA: { mapData: null }
    });

    const result = await strategy.getRoutes(
      { indoorMapId: 'buildingA', room: {} } as MappedInLocation,
      { indoorMapId: 'buildingA', room: {} } as MappedInLocation
    );

    expect(result).toBeNull();
  });

  it('should return null if start and destination are in different buildings', async () => {
    mappedinServiceMock.getCampusMapData.and.returnValue({
      buildingA: { mapData: fakeMapData },
      buildingB: { mapData: fakeMapData }
    });

    const result = await strategy.getRoutes(
      { indoorMapId: 'buildingA', room: {} } as MappedInLocation,
      { indoorMapId: 'buildingB', room: {} } as MappedInLocation
    );

    expect(result).toBeNull();
  });

  it('should compute route when inputs are valid and indoorMapId matches', async () => {
    mappedinServiceMock.getCampusMapData.and.returnValue({
      buildingA: { mapData: fakeMapData }
    });

    const startPoint = { indoorMapId: 'buildingA', room: 'A' } as MappedInLocation;
    const destinationPoint = { indoorMapId: 'buildingA', room: 'B' } as MappedInLocation;

    const result = await strategy.getRoutes(startPoint, destinationPoint);

    expect(fakeMapData.getDirections).toHaveBeenCalledWith('A', 'B');
    expect(fakeMapData.getDirections).toHaveBeenCalledWith('A', 'B', { accessible: true });

    expect(result).toBe(strategy);
    expect(strategy.route).toEqual({
      indoorMapId: 'buildingA',
      directions: ['regular path'],
      accessible_directions: ['accessible path']
    });
  });
});
