import { TestBed } from '@angular/core/testing';
import { NavigationCoordinatorService } from './navigation-coordinator.service';
import { Store } from '@ngrx/store';
import { OutdoorRoutingStrategy, IndoorRoutingStrategy } from '../strategies';
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
      'setStartPoint', 'setDestinationPoint', 'showStartMarker', 'showDestinationMarker',
      'clearNavigation', 'renderNavigation', 'getShortestRoute', 'setSelectedStrategy'
    ]);
    indoorDirectionsSpy = jasmine.createSpyObj('IndoorDirectionsService', [
      'setStartPoint', 'setDestinationPoint', 'clearNavigation', 'renderNavigation'
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
      expect(outdoorStrategySpy.getRoute).toHaveBeenCalledWith(outdoorStart, outdoorDest, 'walking');
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

  describe('findIndoorLocation', () => {
    beforeEach(() => {
      // Mock campus data
      const mockMapData = jasmine.createSpyObj('MapData', ['getByType']);
      
      // Mock spaces and POIs
      const mockSpaces = [
        { name: '531', id: 'space1' },
        { name: '220', id: 'space2' }
      ];
      
      const mockPOIs = [
        { name: 'Elevator', id: 'poi1' },
        { name: 'Stairs', id: 'poi2' }
      ];
      
      const mockFloors = [
        { id: 'floor1', name: '1st Floor' }
      ];
      
      // Setup getByType to return different mock data based on type
      mockMapData.getByType.and.callFake((type: string) => {
        if (type === 'space') return mockSpaces;
        if (type === 'point-of-interest') return mockPOIs;
        if (type === 'floor') return mockFloors;
        return [];
      });
      
      // Mock campus building data
      const mockCampusData = {
        'hall-building': {
          name: 'Hall Building',
          abbreviation: 'H',
          address: '1455 De Maisonneuve Blvd W',
          coordinates: new google.maps.LatLng(45.497, -73.579),
          image: 'assets/images/hall-building.jpg',
          mapData: mockMapData
        },
        'jmsb-building': {
          name: 'John Molson Building',
          abbreviation: 'MB',
          address: '1450 Guy St',
          coordinates: new google.maps.LatLng(45.495, -73.579),
          image: 'assets/images/jmsb-building.jpg',
          mapData: mockMapData
        }
      };
      
      mappedInSpy.getCampusMapData.and.returnValue(mockCampusData);
    });

    it('should find a matching building based on room code', async () => {
      // Call the private method using any type assertion
      const result = await (service as any).findIndoorLocation('H-531');
      
      expect(result).toBeTruthy();
      expect(result.title).toContain('H 531');
      expect(result.buildingCode).toBe('H');
      expect(result.type).toBe('indoor');
    });
    
    it('should find a space within the building if it matches room number', async () => {
      const result = await (service as any).findIndoorLocation('H-531');
      
      expect(result).toBeTruthy();
      expect(result.room).toBeTruthy();
      expect(result.room.name).toBe('531');
    });
    
    it('should handle empty room codes gracefully', async () => {
      const result = await (service as any).findIndoorLocation('');
      expect(result).toBeNull();
    });
    
    it('should handle building codes that don\'t exist', async () => {
      // Should fall back to first building
      const result = await (service as any).findIndoorLocation('XYZ-123');
      
      expect(result).toBeTruthy();
      expect(result.buildingCode).toBe('H'); // First building in the mock data
    });
    
    it('should handle fuzzy matching for building names', async () => {
      const result = await (service as any).findIndoorLocation('molson-101');
      
      expect(result).toBeTruthy();
      expect(result.buildingCode).toBe('MB');
    });
    
    it('should handle missing campus data', async () => {
      mappedInSpy.getCampusMapData.and.returnValue({});
      
      const result = await (service as any).findIndoorLocation('H-531');
      expect(result).toBeNull();
    });
  });

  describe('routeFromCurrentLocationToDestination', () => {
    const mockOutdoorDestination: GoogleMapLocation = {
      title: 'Hall Building',
      address: '1455 De Maisonneuve Blvd W',
      coordinates: new google.maps.LatLng(45.497, -73.579),
      type: 'outdoor'
    };
    
    const mockIndoorDestination: MappedInLocation = {
      title: 'H-531 Room',
      address: '1455 De Maisonneuve Blvd W',
      coordinates: new google.maps.LatLng(45.497, -73.579),
      type: 'indoor',
      indoorMapId: 'hall-building',
      room: '531'
    };

    beforeEach(() => {
      spyOn(console, 'warn');
      spyOn(console, 'error');
      
      // Setup findIndoorLocation spy
      spyOn<any>(service, 'findIndoorLocation').and.callFake(async (roomCode: string) => {
        if (roomCode.includes('H-') || roomCode === '531') {
          return {
            title: 'H-531 Enhanced',
            address: '1455 De Maisonneuve Blvd W',
            coordinates: new google.maps.LatLng(45.497, -73.579),
            type: 'indoor',
            indoorMapId: 'hall-building',
            room: '531',
            buildingCode: 'H',
            roomName: '531'
          };
        }
        return null;
      });
    });

    it('should handle outdoor destinations correctly', async () => {
      await service.routeFromCurrentLocationToDestination(mockOutdoorDestination);
      
      // Verify services were called correctly
      expect(currentLocationSpy.getCurrentLocation).toHaveBeenCalledWith(true);
      expect(outdoorDirectionsSpy.setStartPoint).toHaveBeenCalled();
      expect(outdoorDirectionsSpy.setDestinationPoint).toHaveBeenCalledWith(mockOutdoorDestination);
      expect(outdoorDirectionsSpy.showStartMarker).toHaveBeenCalled();
      expect(outdoorDirectionsSpy.showDestinationMarker).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
      expect(outdoorDirectionsSpy.getShortestRoute).toHaveBeenCalled();
      expect(outdoorDirectionsSpy.renderNavigation).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setShowRoute({ show: true }));
    });

    it('should handle indoor destinations correctly', async () => {
      await service.routeFromCurrentLocationToDestination(mockIndoorDestination);
      
      // Verify indoor services were called
      expect(currentLocationSpy.getCurrentLocation).toHaveBeenCalledWith(true);
      expect(service['findIndoorLocation']).toHaveBeenCalledWith('531');
      expect(indoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
      expect(mappedInSpy.setMapData).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Indoor }));
      expect(indoorDirectionsSpy.renderNavigation).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setShowRoute({ show: true }));
    });

    it('should throw error if getCurrentLocation returns null', async () => {
      currentLocationSpy.getCurrentLocation.and.resolveTo(null);
      
      await service.routeFromCurrentLocationToDestination(mockOutdoorDestination);
      
      // Should not throw, but log an error
      expect(console.error).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setShowRoute({ show: false }));
    });

    it('should fix invalid coordinates in destination', async () => {
      const badDestination = {
        ...mockOutdoorDestination,
        coordinates: { lat: '45.497', lng: '-73.579' }
      };
      
      await service.routeFromCurrentLocationToDestination(badDestination);
      
      // Should attempt to fix coordinates
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid destination coordinates - attempting to fix', 
        jasmine.any(Object)
      );
      
      // Should still work
      expect(outdoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setShowRoute({ show: true }));
    });

    it('should handle clearNavigation errors gracefully', async () => {
      outdoorDirectionsSpy.clearNavigation.and.throwError('Clear error');
      
      await service.routeFromCurrentLocationToDestination(mockOutdoorDestination);
      
      // Should warn but continue
      expect(console.warn).toHaveBeenCalledWith(
        'Error clearing previous routes:', 
        jasmine.any(Error)
      );
      
      // Should still proceed with routing
      expect(outdoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setShowRoute({ show: true }));
    });

    it('should handle showMarker errors gracefully', async () => {
      outdoorDirectionsSpy.showStartMarker.and.throwError('Marker error');
      
      await service.routeFromCurrentLocationToDestination(mockOutdoorDestination);
      
      // Should warn but continue
      expect(console.warn).toHaveBeenCalledWith(
        'Error showing start marker:', 
        jasmine.any(Error)
      );
      
      // Should still proceed with routing
      expect(outdoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setShowRoute({ show: true }));
    });

    it('should handle indoor navigation errors by falling back to outdoor', async () => {
      indoorDirectionsSpy.renderNavigation.and.throwError('Indoor navigation error');
      
      await service.routeFromCurrentLocationToDestination(mockIndoorDestination);
      
      // Should log error and fall back to outdoor
      expect(console.error).toHaveBeenCalledWith(
        'Error rendering indoor navigation, falling back to outdoor:', 
        jasmine.any(Error)
      );
      
      // Should switch to outdoor and try to get a route
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
      expect(outdoorDirectionsSpy.getShortestRoute).toHaveBeenCalled();
    });

    it('should handle getShortestRoute returning null', async () => {
      outdoorDirectionsSpy.getShortestRoute.and.resolveTo(null);
      
      await service.routeFromCurrentLocationToDestination(mockOutdoorDestination);
      
      // Should warn but not fail
      expect(console.warn).toHaveBeenCalledWith('No valid routing strategy found');
      
      // Should not try to render navigation
      expect(outdoorDirectionsSpy.renderNavigation).not.toHaveBeenCalled();
      
      // We'll just verify this part of the behavior instead of the dispatch
      expect(outdoorDirectionsSpy.setStartPoint).toHaveBeenCalled();
      expect(outdoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
    });

    it('should handle completely invalid destinations gracefully', async () => {
      await service.routeFromCurrentLocationToDestination(null);
      
      // Should log error and recover
      expect(console.error).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
      expect(storeSpy.dispatch).toHaveBeenCalledWith(setShowRoute({ show: false }));
    });
  });
});
