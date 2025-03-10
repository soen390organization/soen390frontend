import { TestBed } from '@angular/core/testing';
import { MappedinService } from './mappedIn.service';
import { MapData, MapView } from '@mappedin/mappedin-js';

describe('MappedinService', () => {
  let service: MappedinService;

  // Create a fake MapData with minimal implementation for testing.
  const fakeMapData = {
    getByType: (type: string) => {
      switch (type) {
        case 'floor': return [{ id: 'floor1', name: 'Floor 1' }];
        case 'space': return [{ id: 'space1', name: 'Room 1' }];
        case 'connection': return [];
        case 'point-of-interest': return [];
        default: return [];
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
    TestBed.configureTestingModule({
      providers: [MappedinService],
    });
    service = TestBed.inject(MappedinService);
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
});
