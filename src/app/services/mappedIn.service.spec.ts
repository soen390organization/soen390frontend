// mappedin.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { MappedinService } from './mappedIn.service';
import { MapData, MapView } from '@mappedin/mappedin-js';

describe('MappedinService', () => {
  let service: MappedinService;

  const fakeMapData = {} as MapData;
  const fakeMapView = {} as MapView;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MappedinService],
    });
    service = TestBed.inject(MappedinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeMap', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      
      // Spy on the protected methods in the service.
      spyOn(service as any, 'getMapData').and.returnValue(Promise.resolve(fakeMapData));
      spyOn(service as any, 'show3dMap').and.returnValue(Promise.resolve(fakeMapView));
    });

    it('should initialize the map and set the mapView property', async () => {
      await service.initializeMap(container);

      // Accessing the private mapView property via type-casting for verification.
      expect((service as any).mapView).toEqual(fakeMapView);

      // Verify that the protected methods were called as expected.
      expect((service as any).getMapData).toHaveBeenCalled();
      expect((service as any).show3dMap).toHaveBeenCalledWith(container, fakeMapData);
    });
  });
});
