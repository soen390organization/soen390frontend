import { TestBed } from '@angular/core/testing';
import { NavigationCoordinatorService } from './navigation-coordinator.service';
import { Store } from '@ngrx/store';
import { IndoorRoutingStrategy } from 'src/app/strategies/indoor-routing.strategy';
import { OutdoorRoutingStrategy } from 'src/app/strategies/outdoor-routing.strategy';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';
import { MappedInLocation } from '../interfaces/mappedin-location.interface';
import { setMapType, MapType } from 'src/app/store/app';
import { RouteSegment } from '../interfaces/routing-strategy.interface';

describe('NavigationCoordinatorService', () => {
  let service: NavigationCoordinatorService;
  let storeSpy: jasmine.SpyObj<Store<any>>;
  let outdoorSpy: jasmine.SpyObj<OutdoorRoutingStrategy>;
  let indoorSpy: jasmine.SpyObj<IndoorRoutingStrategy>;

  beforeEach(() => {
    storeSpy = jasmine.createSpyObj('Store', ['dispatch']);
    outdoorSpy = jasmine.createSpyObj('OutdoorRoutingStrategy', ['getRoute']);
    indoorSpy = jasmine.createSpyObj('IndoorRoutingStrategy', ['getRoute']);

    TestBed.configureTestingModule({
      providers: [
        NavigationCoordinatorService,
        { provide: Store, useValue: storeSpy },
        { provide: OutdoorRoutingStrategy, useValue: outdoorSpy },
        { provide: IndoorRoutingStrategy, useValue: indoorSpy }
      ]
    });

    service = TestBed.inject(NavigationCoordinatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCompleteRoute', () => {
    const outdoorStart: GoogleMapLocation = {
      type: 'outdoor',
      coordinates: new google.maps.LatLng(1, 2),
      title: '',
      address: ''
    };
    const outdoorDest: GoogleMapLocation = {
      type: 'outdoor',
      coordinates: new google.maps.LatLng(3, 4),
      title: '',
      address: ''
    };
    const indoorStart: MappedInLocation = {
      type: 'indoor',
      indoorMapId: 'a',
      room: undefined,
      title: '',
      address: ''
    };
    const indoorDest: MappedInLocation = {
      type: 'indoor',
      indoorMapId: 'b',
      room: undefined,
      title: '',
      address: ''
    };
    const mockSegment = {
      type: 'outdoor', // or 'indoor', depending on test
      instructions: ['Go straight', 'Turn left']
    } as const satisfies RouteSegment;

    it('should dispatch Outdoor map type and call outdoor strategy', async () => {
      outdoorSpy.getRoute.and.resolveTo(mockSegment);

      const result = await service.getCompleteRoute(outdoorStart, outdoorDest, 'walking');

      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
      expect(outdoorSpy.getRoute).toHaveBeenCalledWith(outdoorStart, outdoorDest, 'walking');
      expect(result).toEqual({ segments: [mockSegment] });
    });

    it('should dispatch Indoor map type and call indoor strategy', async () => {
      indoorSpy.getRoute.and.resolveTo(mockSegment);

      const result = await service.getCompleteRoute(indoorStart, indoorDest, 'walking');

      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Indoor }));
      expect(indoorSpy.getRoute).toHaveBeenCalledWith(indoorStart, indoorDest, 'walking');
      expect(result).toEqual({ segments: [mockSegment] });
    });

    it('should throw error for mixed types', async () => {
      await expectAsync(
        service.getCompleteRoute(outdoorStart, indoorDest, 'walking')
      ).toBeRejectedWithError('Mixed routing not implemented yet.');

      await expectAsync(
        service.getCompleteRoute(indoorStart, outdoorDest, 'walking')
      ).toBeRejectedWithError('Mixed routing not implemented yet.');

      expect(storeSpy.dispatch).not.toHaveBeenCalled();
      expect(outdoorSpy.getRoute).not.toHaveBeenCalled();
      expect(indoorSpy.getRoute).not.toHaveBeenCalled();
    });
  });
});
