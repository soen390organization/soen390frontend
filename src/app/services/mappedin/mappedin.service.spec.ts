import { TestBed } from '@angular/core/testing';
import { MappedinService } from './mappedin.service';
import { MapData, MapView } from '@mappedin/mappedin-js';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';

describe('MappedinService', () => {
  let service: MappedinService;
  let mockConcordiaDataService: jasmine.SpyObj<ConcordiaDataService>;
  let container: HTMLElement;

  // Create a fake MapData with minimal implementation for testing.
  const fakeMapData = {
    getByType: (type: string) => {
      switch (type) {
        case 'floor':
          return [{ id: 'floor1', name: 'Floor 1' }];
        case 'space':
          return [{ id: 'space1', name: 'Room 1' }];
        case 'connection':
          return [];
        case 'point-of-interest':
          return [];
        default:
          return [];
      }
    }
  } as unknown as MapData;

  // Create a fake MapView with minimal implementation for testing.
  const fakeMapView = {
    currentFloor: { id: 'floor1', name: 'Floor 1' },
    Labels: {
      add: jasmine.createSpy('add')
    },
    updateState: jasmine.createSpy('updateState'),
    setFloor: jasmine.createSpy('setFloor'),
    Navigation: {
      draw: jasmine.createSpy('draw')
    }
  } as unknown as MapView;

  beforeEach(() => {
    mockConcordiaDataService = jasmine.createSpyObj('ConcordiaDataService', ['getBuildings']);
    TestBed.configureTestingModule({
      providers: [MappedinService,
        {provide: ConcordiaDataService, useValue: mockConcordiaDataService }]

    });
    service = TestBed.inject(MappedinService);
    container = document.createElement('div');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /* This is a test that needs to be fixed, keep it as is */
  /*   describe('initializeMap', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');

      // Instead of spying on the external getMapData,
      // we spy on our encapsulated fetchMapData method.
      spyOn(service as any, 'fetchMapData').and.returnValue(Promise.resolve(fakeMapData));

      // Spy on the protected show3dMap method to return our fakeMapView.
      spyOn(service as any, 'show3dMap').and.returnValue(Promise.resolve(fakeMapView));
    });

    it('should initialize the map and set the mapView property', async () => {
      await service.initializeMap(container);

      // Check that the hardcoded map id was set.
      expect(service.getMapId()).toEqual('67b674be13a4e9000b46cf2e');

      // Verify that the private mapView property is now set.
      expect((service as any).mapView).toEqual(fakeMapView);

      // Ensure that fetchMapData was called with the expected parameters.
      expect((service as any).fetchMapData).toHaveBeenCalledWith('67b674be13a4e9000b46cf2e');

      // Verify that show3dMap was called with the container and fake map data.
      expect((service as any).show3dMap).toHaveBeenCalledWith(container, fakeMapData);
    });
  }); */

  describe('getFloors', () => {
    it('should return an array of floors when map data is available', async () => {
      // Set the fake mapData in the BehaviorSubject.
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
      const currentFloor = service.getCurrentFloor();
      expect(currentFloor).toBeNull();
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
      mockConcordiaDataService.getBuildings.and.callFake((campus: string) => {
        if (campus === 'sgw') {
          return [{ name: 'Building A', abbreviation: 'A', address: '123 St', indoorMapId: 'map1' }];
        }
        if (campus === 'loy') {
          return [{ name: 'Building B', abbreviation: 'B', address: '456 St', indoorMapId: 'map2' }];
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

      service.getMapData().subscribe((data) => {
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
});
