import { TestBed } from '@angular/core/testing';
import { IndoorDirectionsService } from './indoor-directions.service';
import { MappedinService } from '../mappedin/mappedin.service';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { MapData, MapView, Door } from '@mappedin/mappedin-js';

describe('IndoorDirectionsService', () => {
  let service: IndoorDirectionsService;
  let mappedinServiceSpy: jasmine.SpyObj<MappedinService>;

  const mockMapData: jasmine.SpyObj<MapData> = jasmine.createSpyObj('MapData', ['getByType', 'getDirections']);
  const mockMapView: jasmine.SpyObj<MapView> = jasmine.createSpyObj('MapView', ['clear'], {
    Navigation: {
      draw: jasmine.createSpy('draw')
    }
  });

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MappedinService', ['getCampusMapData', 'getMapId', 'getMapData'], {
      mapView: mockMapView
    });

    TestBed.configureTestingModule({
      providers: [
        IndoorDirectionsService,
        { provide: MappedinService, useValue: spy }
      ]
    });

    service = TestBed.inject(IndoorDirectionsService);
    mappedinServiceSpy = TestBed.inject(MappedinService) as jasmine.SpyObj<MappedinService>;
  });

  describe('getEntrances', () => {
    // it('should return doors with name "Door" when room is provided', async () => {
    //   const mockDoors: Door[] = [
    //     { name: 'Door' } as Door,
    //     { name: 'NotADoor' } as Door
    //   ];
    //   const mockRoom = { indoorMapId: '1' } as MappedInLocation;
    //   mappedinServiceSpy.getCampusMapData.and.returnValue({
    //     '1': { mapData: mockMapData }
    //   } as any);
    //   mockMapData.getByType.and.returnValue(mockDoors);

    //   const result = await service.getEntrances(mockRoom);
    //   expect(result?.length).toBe(1);
    //   expect(result?.[0].name).toBe('Door');
    // });

    it('should return null if no room is provided', async () => {
      const result = await service.getEntrances(null as any);
      expect(result).toBeNull();
    });
  });

  describe('getStartPointEntrances', () => {
    it('should call getStartPoint and getEntrances', async () => {
      const location = { indoorMapId: '1' } as MappedInLocation;
      spyOn(service, 'getStartPoint').and.resolveTo(location);
      spyOn(service, 'getEntrances').and.resolveTo([{} as Door]);

      const result = await service.getStartPointEntrances();
      expect(result).toEqual([{} as Door]);
    });
  });

  describe('getDestinationPointEntrances', () => {
    it('should call getDestinationPoint and getEntrances', async () => {
      const location = { indoorMapId: '1' } as MappedInLocation;
      spyOn(service, 'getDestinationPoint').and.resolveTo(location);
      spyOn(service, 'getEntrances').and.resolveTo([{} as Door]);

      const result = await service.getDestinationPointEntrances();
      expect(result).toEqual([{} as Door]);
    });
  });

  describe('navigate', () => {
    it('should log error if required data is missing', async () => {
      spyOn(console, 'error');
      mappedinServiceSpy.getMapData.and.resolveTo(null as any);
      await service.navigate(null, null);
      expect(console.error).toHaveBeenCalled();
    });

    it('should log error if directions are not available', async () => {
      spyOn(console, 'error');
      mappedinServiceSpy.getMapData.and.resolveTo(mockMapData);
      mockMapData.getDirections.and.returnValue(null as any);
      await service.navigate({} as any, {} as any);
      expect(console.error).toHaveBeenCalledWith(
        'Unable to generate directions between rooms',
        { startPoint: {}, destinationPoint: {} }
      );
    });

    it('should call Navigation.draw when directions are available', async () => {
      const directions = {} as any;
      mappedinServiceSpy.getMapData.and.resolveTo(mockMapData);
      mockMapData.getDirections.and.returnValue(directions);

      await service.navigate({} as any, {} as any);
      expect(mockMapView.Navigation.draw).toHaveBeenCalledWith(directions);
    });

  //   it('should catch and log errors thrown in draw', async () => {
  //     const directions = {} as any;
  //     mappedinServiceSpy.getMapData.and.resolveTo(mockMapData);
  //     mockMapData.getDirections.and.returnValue(directions);
  //     mockMapView.Navigation.draw.and.throwError('Draw error');
  //     spyOn(console, 'error');

  //     await service.navigate({} as any, {} as any);
  //     expect(console.error).toHaveBeenCalledWith(
  //       'Error drawing navigation route:',
  //       jasmine.any(Error)
  //     );
  //   });
  });

  describe('renderNavigation', () => {
    it('should navigate directly between rooms if on same map', async () => {
      const start = { indoorMapId: 'A', room: 'start' } as any;
      const dest = { indoorMapId: 'A', room: 'end' } as any;
      spyOn(service, 'getStartPoint').and.resolveTo(start);
      spyOn(service, 'getDestinationPoint').and.resolveTo(dest);
      const navigateSpy = spyOn(service, 'navigate').and.resolveTo();

      await service.renderNavigation();
      expect(navigateSpy).toHaveBeenCalledWith('start', 'end');
    });

    it('should navigate using start entrances if current map is start', async () => {
      const start = { indoorMapId: 'A', room: 'start' } as any;
      const dest = { indoorMapId: 'B', room: 'end' } as any;
      spyOn(service, 'getStartPoint').and.resolveTo(start);
      spyOn(service, 'getDestinationPoint').and.resolveTo(dest);
      mappedinServiceSpy.getMapId.and.returnValue('A');
      spyOn(service, 'getStartPointEntrances').and.resolveTo(['entrance'] as any);
      const navigateSpy = spyOn(service, 'navigate').and.resolveTo();

      await service.renderNavigation();
      expect(navigateSpy).toHaveBeenCalledWith('start', ['entrance']);
    });

    it('should navigate using destination entrances if current map is destination', async () => {
      const start = { indoorMapId: 'A', room: 'start' } as any;
      const dest = { indoorMapId: 'B', room: 'end' } as any;
      spyOn(service, 'getStartPoint').and.resolveTo(start);
      spyOn(service, 'getDestinationPoint').and.resolveTo(dest);
      mappedinServiceSpy.getMapId.and.returnValue('B');
      spyOn(service, 'getDestinationPointEntrances').and.resolveTo(['entrance'] as any);
      const navigateSpy = spyOn(service, 'navigate').and.resolveTo();

      await service.renderNavigation();
      expect(navigateSpy).toHaveBeenCalledWith(['entrance'], 'end');
    });
  });

  describe('clearNavigation', () => {
    it('should call mapView.clear', async () => {
      await service.clearNavigation();
      expect(mockMapView.clear).toHaveBeenCalled();
    });
  });
});
