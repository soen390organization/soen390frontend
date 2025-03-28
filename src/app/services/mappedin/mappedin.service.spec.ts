import { TestBed } from '@angular/core/testing';
import { MappedinService } from './mappedin.service';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { of } from 'rxjs';
import { MapData, MapView } from '@mappedin/mappedin-js';

describe('MappedinService', () => {
  let service: MappedinService;
  let mockConcordiaDataService: jasmine.SpyObj<ConcordiaDataService>;
  let container: HTMLElement;

  // Fake MapData with minimal implementation.
  const fakeMapData = {
    getByType: (type: string) => {
      if (type === 'floor') {
        return [{ id: 'floor1', name: 'Floor 1' }];
      }
      return [];
    }
  } as unknown as MapData;

  // Fake MapView with minimal implementation.
  const fakeMapView = {
    currentFloor: { id: 'floor1', name: 'Floor 1' },
    setFloor: jasmine.createSpy('setFloor'),
    Navigation: {
      clear: jasmine.createSpy('clear')
    }
  } as unknown as MapView;

  beforeEach(() => {
    mockConcordiaDataService = jasmine.createSpyObj('ConcordiaDataService', ['getBuildings']);
    TestBed.configureTestingModule({
      providers: [
        MappedinService,
        { provide: ConcordiaDataService, useValue: mockConcordiaDataService }
      ]
    });
    service = TestBed.inject(MappedinService);
    container = document.createElement('div');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFloors', () => {
    it('should return an array of floors when map data is available', async () => {
      (service as any).mapData$.next(fakeMapData);
      const floors = await service.getFloors();
      expect(floors).toEqual([{ id: 'floor1', name: 'Floor 1' }]);
    });

    it('should return an empty array if no map data is available', async () => {
      (service as any).mapData$.next(null);
      const floors = await service.getFloors();
      expect(floors).toEqual([]);
    });
  });

  describe('getCurrentFloor', () => {
    it('should return the current floor if available', () => {
      (service as any).mapView = fakeMapView;
      const currentFloor = service.getCurrentFloor();
      expect(currentFloor).toEqual({ id: 'floor1', name: 'Floor 1' });
    });

    it('should return null if mapView or currentFloor is not available', () => {
      (service as any).mapView = undefined;
      expect(service.getCurrentFloor()).toBeNull();
    });
  });

  describe('setFloor', () => {
    it('should call setFloor on the mapView', () => {
      (service as any).mapView = fakeMapView;
      service.setFloor('newFloorId');
      expect(fakeMapView.setFloor).toHaveBeenCalledWith('newFloorId');
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      // Simulate buildings for both campuses.
      mockConcordiaDataService.getBuildings.and.callFake((campus: string) => {
        if (campus === 'sgw') {
          return [
            { name: 'Building A', abbreviation: 'A', address: '123 St', indoorMapId: 'map1' }
          ];
        }
        if (campus === 'loy') {
          return [
            { name: 'Building B', abbreviation: 'B', address: '456 St', indoorMapId: 'map2' }
          ];
        }
        return [];
      });

      spyOn(service as any, 'fetchMapData').and.callFake((mapId: string) => {
        return Promise.resolve(fakeMapData);
      });

      spyOn(service, 'setMapData').and.callFake(async (mapId: string) => {
        service['mapId'] = mapId;
        service['mapData$'].next(fakeMapData);
      });
    });

    it('should initialize the map and set campusMapData correctly', async () => {
      await service.initialize(container);

      expect(service.getCampusMapData()).toEqual({
        map1: { name: 'Building A', abbreviation: 'A', address: '123 St', mapData: fakeMapData },
        map2: { name: 'Building B', abbreviation: 'B', address: '456 St', mapData: fakeMapData }
      });
    });

    it('should call fetchMapData for each building with an indoorMapId', async () => {
      await service.initialize(container);
      expect((service as any).fetchMapData).toHaveBeenCalledWith('map1');
      expect((service as any).fetchMapData).toHaveBeenCalledWith('map2');
    });

    it('should call setMapData with the default map ID after initialization', async () => {
      await service.initialize(container);
      expect(service.setMapData).toHaveBeenCalledWith('67b674be13a4e9000b46cf2e');
    });
  });

  describe('getMapData', () => {
    it('should return an observable of mapData', (done) => {
      (service as any).mapData$.next(fakeMapData);
      service.getMapData$().subscribe((data) => {
        expect(data).toBe(fakeMapData);
        done();
      });
    });
  });

  describe('getMapView', () => {
    it('should return an observable of mapView', (done) => {
      (service as any).mapView$.next(fakeMapView);
      service.getMapView().subscribe((data) => {
        expect(data).toBe(fakeMapView);
        done();
      });
    });
  });

  describe('getMapId', () => {
    it('should return the current map ID', () => {
      (service as any).mapId = 'testMapId';
      expect(service.getMapId()).toBe('testMapId');
    });
  });

  describe('clearNavigation', () => {
    it('should call clear on Navigation if available', () => {
      (service as any).mapView = {
        Navigation: {
          clear: jasmine.createSpy('clear')
        }
      };
      service.clearNavigation();
      expect((service as any).mapView.Navigation.clear).toHaveBeenCalled();
    });

    it('should log error if Navigation.clear throws', () => {
      const error = new Error('clear error');
      (service as any).mapView = {
        Navigation: {
          clear: jasmine.createSpy('clear').and.throwError(error)
        }
      };
      spyOn(console, 'error');
      service.clearNavigation();
      expect(console.error).toHaveBeenCalledWith('Error clearing indoor navigation:', error);
    });
  });
});
