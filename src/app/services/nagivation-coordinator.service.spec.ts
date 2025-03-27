import { TestBed } from '@angular/core/testing';
import { NavigationCoordinatorService } from './navigation-coordinator.service';
import { DirectionsService } from './outdoor-directions/outdoor-directions.service';
import { IndoorDirectionsService } from '../services/indoor-directions/indoor-directions.service';
import { OutdoorRoutingStrategy } from '../strategies/outdoor-routing.strategy';
import { IndoorRoutingStrategy } from '../strategies/indoor-routing.strategy';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { setMapType, MapType } from 'src/app/store/app';
import { MappedInLocation } from '../interfaces/mappedin-location.interface';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';

describe('NavigationCoordinatorService', () => {
  let service: NavigationCoordinatorService;
  let mockStore: jasmine.SpyObj<Store<any>>;
  let mockDirectionsService: any;
  let mockIndoorDirectionsService: any;
  let mockOutdoorStrategy: any;
  let mockIndoorStrategy: any;

  beforeEach(() => {
    mockStore = jasmine.createSpyObj('Store', ['dispatch']);

    // Outdoor locations include coordinates
    mockDirectionsService = {
      getStartPoint: jasmine.createSpy('getStartPoint').and.returnValue(
        of({
          address: 'Outdoor Start',
          title: 'Start',
          coordinates: new google.maps.LatLng(45, -73),
          type: 'outdoor'
        })
      ),
      getDestinationPoint: jasmine.createSpy('getDestinationPoint').and.returnValue(
        of({
          address: 'Outdoor Destination',
          title: 'Destination',
          coordinates: new google.maps.LatLng(46, -74),
          type: 'outdoor'
        })
      )
    };

    // Indoor locations (MappedInLocation) should not include coordinates.
    mockIndoorDirectionsService = {
      getStartPoint: jasmine.createSpy('getStartPoint').and.returnValue(of(null)),
      getDestinationPoint: jasmine.createSpy('getDestinationPoint').and.returnValue(of(null))
    };

    mockOutdoorStrategy = {
      getRoute: jasmine
        .createSpy('getRoute')
        .and.returnValue(Promise.resolve({ type: 'outdoor', instructions: 'outdoorRoute' }))
    };

    mockIndoorStrategy = {
      getRoute: jasmine
        .createSpy('getRoute')
        .and.returnValue(Promise.resolve({ type: 'indoor', instructions: 'indoorRoute' }))
    };

    TestBed.configureTestingModule({
      providers: [
        NavigationCoordinatorService,
        { provide: Store, useValue: mockStore },
        { provide: DirectionsService, useValue: mockDirectionsService },
        { provide: IndoorDirectionsService, useValue: mockIndoorDirectionsService },
        { provide: OutdoorRoutingStrategy, useValue: mockOutdoorStrategy },
        { provide: IndoorRoutingStrategy, useValue: mockIndoorStrategy }
      ]
    });
    service = TestBed.inject(NavigationCoordinatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('globalRoute$', () => {
    it('should emit a route when outdoor points are set', (done) => {
      service.globalRoute$.subscribe((route) => {
        expect(route).toEqual({ segments: [{ type: 'outdoor', instructions: 'outdoorRoute' }] });
        done();
      });
    });

    it('should emit a route when indoor points are set', (done) => {
      // Override the outdoor observables to emit null
      mockDirectionsService.getStartPoint.and.returnValue(of(null));
      mockDirectionsService.getDestinationPoint.and.returnValue(of(null));
      // And set the indoor observables with valid indoor data.
      mockIndoorDirectionsService.getStartPoint.and.returnValue(
        of({
          room: 'A101',
          title: 'Start',
          address: 'Indoor Start',
          type: 'indoor',
          indoorMapId: 'map1'
        })
      );
      mockIndoorDirectionsService.getDestinationPoint.and.returnValue(
        of({
          room: 'B202',
          title: 'Destination',
          address: 'Indoor Destination',
          type: 'indoor',
          indoorMapId: 'map1'
        })
      );

      // Re-create the NavigationCoordinatorService so that globalRoute$ picks up the new values.
      service = new NavigationCoordinatorService(
        mockStore,
        mockDirectionsService,
        mockIndoorDirectionsService,
        mockOutdoorStrategy,
        mockIndoorStrategy
      );

      service.globalRoute$.subscribe((route) => {
        expect(route).toEqual({ segments: [{ type: 'indoor', instructions: 'indoorRoute' }] });
        done();
      });
    });
  });

  describe('getCompleteRoute()', () => {
    it('should use outdoorStrategy for outdoor locations', async () => {
      const outdoorStart: GoogleMapLocation = {
        address: 'Outdoor Start',
        title: 'Start',
        coordinates: new google.maps.LatLng(45, -73),
        type: 'outdoor'
      };
      const outdoorDest: GoogleMapLocation = {
        address: 'Outdoor Destination',
        title: 'Destination',
        coordinates: new google.maps.LatLng(46, -74),
        type: 'outdoor'
      };

      const route = await service.getCompleteRoute(outdoorStart, outdoorDest, 'WALKING');
      expect(mockStore.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
      expect(mockOutdoorStrategy.getRoute).toHaveBeenCalledWith(
        outdoorStart,
        outdoorDest,
        'WALKING'
      );
      expect(route).toEqual({ segments: [{ type: 'outdoor', instructions: 'outdoorRoute' }] });
    });

    it('should use indoorStrategy for indoor locations', async () => {
      const indoorStart: MappedInLocation = {
        room: 'A101',
        title: 'Start',
        address: 'Indoor Start',
        type: 'indoor',
        indoorMapId: 'map1'
      };
      const indoorDest: MappedInLocation = {
        room: 'B202',
        title: 'Destination',
        address: 'Indoor Destination',
        type: 'indoor',
        indoorMapId: 'map1'
      };

      const route = await service.getCompleteRoute(indoorStart, indoorDest, 'WALKING');
      expect(mockStore.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Indoor }));
      expect(mockIndoorStrategy.getRoute).toHaveBeenCalledWith(indoorStart, indoorDest, 'WALKING');
      expect(route).toEqual({ segments: [{ type: 'indoor', instructions: 'indoorRoute' }] });
    });

    it('should throw error for mixed routing', async () => {
      const outdoorStart: GoogleMapLocation = {
        address: 'Outdoor Start',
        title: 'Start',
        coordinates: new google.maps.LatLng(45, -73),
        type: 'outdoor'
      };
      const indoorDest: MappedInLocation = {
        room: 'B202',
        title: 'Destination',
        address: 'Indoor Destination',
        type: 'indoor',
        indoorMapId: 'map1'
      };

      await expectAsync(
        service.getCompleteRoute(outdoorStart, indoorDest, 'WALKING')
      ).toBeRejectedWithError('Mixed routing not implemented yet.');
    });
  });
});
