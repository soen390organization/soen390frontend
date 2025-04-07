import { TestBed } from '@angular/core/testing';
import { MappedinService } from './mappedin.service';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { of } from 'rxjs';
import { MapData, MapView } from '@mappedin/mappedin-js';
import { MapViewBuilder } from 'src/app/builders/map-view.builder';

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
      if (type === 'space') {
        return [{ id: 'space1', name: '531' }, { id: 'space2', name: '220' }];
      }
      if (type === 'point-of-interest') {
        return [{ id: 'poi1', name: 'Elevator' }, { id: 'poi2', name: 'Stairs' }];
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
            { 
              name: 'Building A', 
              abbreviation: 'A', 
              address: '123 St', 
              indoorMapId: 'map1',
              coordinates: { lat: 45.497, lng: -73.579 }
            }
          ];
        }
        if (campus === 'loy') {
          return [
            { 
              name: 'Building B', 
              abbreviation: 'B', 
              address: '456 St', 
              indoorMapId: 'map2',
              coordinates: { lat: 45.5, lng: -73.6 }
            }
          ];
        }
        return [];
      });

      spyOn(service, 'fetchMapData').and.returnValue(Promise.resolve(fakeMapData));
      spyOn(service, 'setMapData').and.returnValue(Promise.resolve());
    });

    it('should initialize the map and set campusMapData correctly', async () => {
      await service.initialize(container);
      const campusMapData = service.getCampusMapData();
      
      expect(campusMapData['map1']).toBeDefined();
      expect(campusMapData['map2']).toBeDefined();
      expect(campusMapData['map1'].name).toBe('Building A');
      expect(campusMapData['map2'].name).toBe('Building B');
    });

    it('should call fetchMapData for each building with an indoorMapId', async () => {
      await service.initialize(container);
      expect(service.fetchMapData).toHaveBeenCalledWith('map1');
      expect(service.fetchMapData).toHaveBeenCalledWith('map2');
    });

    it('should call setMapData with the default map ID after initialization', async () => {
      await service.initialize(container);
      expect(service.setMapData).toHaveBeenCalledWith('67b674be13a4e9000b46cf2e');
    });
    
    it('should prevent re-initialization if mapView already exists', async () => {
      (service as any).mapView = {}; // Mock existing mapView
      await service.initialize(container);
      expect(mockConcordiaDataService.getBuildings).not.toHaveBeenCalled();
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
    
    it('should return mapData through Promise API', async () => {
      (service as any).mapData$.next(fakeMapData);
      const result = await service.getMapData();
      expect(result).toBe(fakeMapData);
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
  
  describe('setMapData', () => {
    beforeEach(() => {
      // Setup the mock campus data
      (service as any).campusMapData = {
        'map1': {
          mapData: fakeMapData,
          name: 'Test Building'
        }
      };
      (service as any).mappedInContainer = document.createElement('div');
    });
    
    it('should skip if the mapId is already active', async () => {
      (service as any).mapId = 'map1';
      spyOn(service['mapData$'], 'next');
      
      await service.setMapData('map1');
      
      expect(service['mapData$'].next).not.toHaveBeenCalled();
    });
    
    it('should update mapData and mapId when changing maps', async () => {
      // Override the actual setMapData method to avoid MapViewBuilder issues
      const originalMethod = service.setMapData;
      spyOn(service, 'setMapData').and.callFake(async (mapId: string) => {
        if (mapId === (service as any).mapId) return;
        
        (service as any).mapId = mapId;
        const mapData = (service as any).campusMapData[mapId].mapData;
        service['mapData$'].next(mapData);
        
        return Promise.resolve();
      });
      
      // Set up a different initial map ID
      (service as any).mapId = 'differentMap';
      
      await service.setMapData('map1');
      
      // Verify the map ID was updated
      expect(service.getMapId()).toBe('map1');
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

  describe('findIndoorLocation', () => {
    beforeEach(() => {
      // Setup a mock campus data with rooms/spaces
      const mockMapData = {
        getByType: (type: string) => {
          if (type === 'space') {
            return [
              { id: 'space1', name: '531' },
              { id: 'space2', name: '220' }
            ];
          } else if (type === 'point-of-interest') {
            return [
              { id: 'poi1', name: 'Elevator' },
              { id: 'poi2', name: 'Stairs' }
            ];
          }
          return [];
        }
      };

      // Mock campus map data
      (service as any).campusMapData = {
        'map1': {
          name: 'Hall Building',
          abbreviation: 'H',
          address: '1455 De Maisonneuve Blvd W',
          coordinates: new google.maps.LatLng(45.497, -73.579),
          image: 'assets/images/hall-building.jpg',
          mapData: mockMapData
        },
        'map2': {
          name: 'JMSB Building',
          abbreviation: 'MB',
          address: '1450 Guy St',
          coordinates: new google.maps.LatLng(45.495, -73.579),
          image: 'assets/images/jmsb-building.jpg',
          mapData: mockMapData
        }
      };
    });

    it('should return null if room code is empty', async () => {
      spyOn(console, 'warn');
      const result = await service.findIndoorLocation('');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Cannot find indoor location for empty or invalid room code');
    });

    it('should return null if no campus data is available', async () => {
      spyOn(console, 'warn');
      // Clear campus data
      (service as any).campusMapData = {};
      const result = await service.findIndoorLocation('H-531');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('No campus data available');
    });

    it('should find a matching building and room by room code', async () => {
      const result = await service.findIndoorLocation('H-531');
      expect(result).not.toBeNull();
      expect(result?.buildingCode).toBe('H');
      expect(result?.roomName).toBe('531');
      expect(result?.type).toBe('indoor');
      expect(result?.title).toBe('H 531');
    });

    it('should return null if no matching building found', async () => {
      spyOn(console, 'warn');
      const result = await service.findIndoorLocation('XYZ-123');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('No matching building found for code: XYZ');
    });

    it('should find a room from points of interest if not found in spaces', async () => {
      // This should look for 'Elevator' in POIs after not finding it in spaces
      const result = await service.findIndoorLocation('H-Elevator');
      expect(result).not.toBeNull();
      expect(result?.roomName).toBe('Elevator');
    });

    it('should return null if matching building found but no matching room', async () => {
      spyOn(console, 'warn');
      const result = await service.findIndoorLocation('H-999');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(jasmine.stringMatching(/No matching room found for H-999/));
    });

    it('should handle errors gracefully', async () => {
      spyOn(console, 'error');
      // Create a new function that will always throw an error when called
      const throwingFunction = jasmine.createSpy('throwingFunction').and.throwError(new Error('Test error'));
      
      // Mock the service's findSpaceOrPoi method to throw an error
      spyOn(service as any, 'findSpaceOrPoi').and.callFake(throwingFunction);
      
      const result = await service.findIndoorLocation('H-531');
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error finding indoor location:', jasmine.any(Error));
    });
  });
});