import { TestBed } from '@angular/core/testing';
import { NavigationCoordinatorService } from './navigation-coordinator.service';
import { Store } from '@ngrx/store';
import { IndoorRoutingStrategy } from 'src/app/strategies/indoor-routing.strategy';
import { OutdoorRoutingStrategy } from 'src/app/strategies/outdoor-routing.strategy';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';
import { MappedInLocation } from '../interfaces/mappedin-location.interface';
import { setMapType, MapType, setShowRoute } from 'src/app/store/app';
import { RouteSegment } from '../interfaces/routing-strategy.interface';
import { OutdoorDirectionsService } from './outdoor-directions/outdoor-directions.service';
import { IndoorDirectionsService } from './indoor-directions/indoor-directions.service';
import { CurrentLocationService } from './current-location/current-location.service';
import { PlacesService } from './places/places.service';
import { MappedinService } from './mappedin/mappedin.service';
import { BehaviorSubject, of } from 'rxjs';

describe('NavigationCoordinatorService', () => {
  let service: NavigationCoordinatorService;
  let storeSpy: jasmine.SpyObj<Store<any>>;
  let outdoorStrategySpy: jasmine.SpyObj<OutdoorRoutingStrategy>;
  let indoorStrategySpy: jasmine.SpyObj<IndoorRoutingStrategy>;
  let outdoorDirectionsSpy: jasmine.SpyObj<OutdoorDirectionsService>;
  let indoorDirectionsSpy: jasmine.SpyObj<IndoorDirectionsService>;
  let currentLocationSpy: jasmine.SpyObj<CurrentLocationService>;
  let placesSpy: jasmine.SpyObj<PlacesService>;
  let mappedInSpy: jasmine.SpyObj<MappedinService>;

  beforeEach(() => {
    storeSpy = jasmine.createSpyObj('Store', ['dispatch']);
    outdoorStrategySpy = jasmine.createSpyObj('OutdoorRoutingStrategy', ['getRoute']);
    indoorStrategySpy = jasmine.createSpyObj('IndoorRoutingStrategy', ['getRoute']);
    outdoorDirectionsSpy = jasmine.createSpyObj('OutdoorDirectionsService', [
      'setStartPoint',
      'setDestinationPoint',
      'showStartMarker',
      'showDestinationMarker',
      'clearNavigation',
      'renderNavigation',
      'getShortestRoute',
      'setSelectedStrategy'
    ]);
    indoorDirectionsSpy = jasmine.createSpyObj('IndoorDirectionsService', [
      'setStartPoint',
      'setDestinationPoint',
      'clearNavigation',
      'renderNavigation'
    ]);
    currentLocationSpy = jasmine.createSpyObj('CurrentLocationService', ['getCurrentLocation']);
    placesSpy = jasmine.createSpyObj('PlacesService', ['getPlaceSuggestions']);
    mappedInSpy = jasmine.createSpyObj('MappedinService', ['getCampusMapData', 'setMapData']);

    // Default return values
    currentLocationSpy.getCurrentLocation.and.resolveTo({ lat: 45, lng: -73 });
    // Return a mock strategy object instead of a string
    outdoorDirectionsSpy.getShortestRoute.and.resolveTo({ type: 'walking' } as any);

    // Mock behavior subject for lastKnownPosition
    Object.defineProperty(currentLocationSpy, 'lastKnownPosition', {
      value: new BehaviorSubject<{ lat: number; lng: number } | null>(null)
    });

    TestBed.configureTestingModule({
      providers: [
        NavigationCoordinatorService,
        { provide: Store, useValue: storeSpy },
        { provide: OutdoorRoutingStrategy, useValue: outdoorStrategySpy },
        { provide: IndoorRoutingStrategy, useValue: indoorStrategySpy },
        { provide: OutdoorDirectionsService, useValue: outdoorDirectionsSpy },
        { provide: IndoorDirectionsService, useValue: indoorDirectionsSpy },
        { provide: CurrentLocationService, useValue: currentLocationSpy },
        { provide: PlacesService, useValue: placesSpy },
        { provide: MappedinService, useValue: mappedInSpy }
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
      outdoorStrategySpy.getRoute.and.resolveTo(mockSegment);

      const result = await service.getCompleteRoute(outdoorStart, outdoorDest, 'walking');

      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
      expect(outdoorStrategySpy.getRoute).toHaveBeenCalledWith(
        outdoorStart,
        outdoorDest,
        'walking'
      );
      expect(result).toEqual({ segments: [mockSegment] });
    });

    it('should dispatch Indoor map type and call indoor strategy', async () => {
      indoorStrategySpy.getRoute.and.resolveTo(mockSegment);

      const result = await service.getCompleteRoute(indoorStart, indoorDest, 'walking');

      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Indoor }));
      expect(indoorStrategySpy.getRoute).toHaveBeenCalledWith(indoorStart, indoorDest, 'walking');
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
      expect(outdoorStrategySpy.getRoute).not.toHaveBeenCalled();
      expect(indoorStrategySpy.getRoute).not.toHaveBeenCalled();
    });
  });
});
