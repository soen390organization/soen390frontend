import { TestBed } from '@angular/core/testing';
import { PlacesService } from './places.service';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { MappedinService } from '../mappedin/mappedin.service';
import {BuildingData} from '../mappedin/mappedin.service';

describe('PlacesService', () => {
  let service: PlacesService;
  let storeMock: any;
  let mapMock: google.maps.Map;
  let placesServiceMock: any;
  let mappedinService: jasmine.SpyObj<MappedinService>;

  beforeEach(() => {
    mappedinService = jasmine.createSpyObj('MappedinService', ['getCampusMapData']);
    // Mock the Store
    storeMock = {
      select: jasmine.createSpy().and.returnValue(of('campusKey'))
    };

    TestBed.configureTestingModule({
      providers: [PlacesService, { provide: Store, useValue: storeMock },
                                  {provide: MappedinService, useValue: mappedinService }
      ]
    });
    service = TestBed.inject(PlacesService);
    mappedinService = TestBed.inject(MappedinService) as jasmine.SpyObj<MappedinService>;

    // Mock for the google map and placesService
    service['placesServiceReady'] = new BehaviorSubject<boolean>(false);
    mapMock = jasmine.createSpyObj('google.maps.Map', ['setCenter', 'setZoom']);
    placesServiceMock = jasmine.createSpyObj('PlacesService', ['nearbySearch']);
    service['placesService'] = placesServiceMock;

    service['campusData'] = {
      campusKey: {
        coordinates: { lat: 1, lng: 1 },
        buildings: [
          {
            name: 'Building 1',
            coordinates: { lat: 1, lng: 1 },
            address: 'Address 1',
            image: 'image1.jpg'
          }
        ]
      }
    };

    service['placesServiceReady'].next(true);
  });

  describe('Existing tests', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize the PlacesService', async () => {
      spyOn(service, 'initialize').and.callThrough();

      // Simulate that the service is ready immediately
      service['placesServiceReady'].next(true);

      // Check the result after simulating readiness
      const anyService = service as any;
      expect(anyService.placesServiceReady.getValue()).toBeTrue();
      expect(anyService.placesService).toBeDefined();
    });

    it('should fetch campus buildings correctly', async () => {
      const mockCampusData = {
        campusKey: {
          buildings: [
            {
              name: 'Building 1',
              coordinates: { lat: 1, lng: 1 },
              address: 'Address 1',
              image: 'image1.jpg'
            }
          ]
        }
      };
      service['campusData'] = mockCampusData;

      const buildings = await service.getCampusBuildings();

      expect(buildings.length).toBe(1);
      expect(buildings[0].title).toBe('Building 1');
    });

    // it('should return mock campus map data', () => {
    //   mappedinService.getCampusMapData.and.returnValue({
    //     'building1': {
    //       abbreviation: 'ABC',
    //       name: 'Main Building',
    //       address: '123 Main St',
    //       mapData: {
    //         getByType: (type: string) => {
    //           if (type === 'space') {
    //             return [{ name: 'Room 101' }, { name: 'Room 102' }];
    //           }
    //           if (type === 'point-of-interest') {
    //             return [{ name: 'Cafe' }, { name: 'Library' }];
    //           }
    //           return [];
    //         }
    //       } as any // Add `as any` if TypeScript complains
    //     }
    //   } as Record<string, BuildingData>);
  
    //   const data = mappedinService.getCampusMapData();
    //   expect(data['building1'].abbreviation).toBe('ABC');
    //   expect(data['building1'].mapData.getByType('space')).toEqual([{ name: 'Room 101' }, { name: 'Room 102' }]);
    // }); 

    it('should fetch points of interest correctly from getPointsOfInterest', async () => {
      // Mock the campus data and store behavior
      const mockCampusData = {
        campusKey: {
          coordinates: new google.maps.LatLng(1, 1)
        }
      };
      service['campusData'] = mockCampusData;

      // Mock the places service API call to return restaurant data
      const mockResults: google.maps.places.PlaceResult[] = [
        {
          business_status: 'OPERATIONAL' as any,
          name: 'Restaurant 1',
          geometry: { location: new google.maps.LatLng(1, 1) },
          vicinity: 'Address 1',
          photos: [
            {
              getUrl: () => 'image-url',
              height: 0,
              html_attributions: [],
              width: 0
            }
          ]
        }
      ];

      placesServiceMock.nearbySearch.and.callFake(
        (
          request: google.maps.places.PlaceSearchRequest,
          callback: (results: google.maps.places.PlaceResult[], status: any) => void
        ) => {
          callback(mockResults, 'OK');
        }
      );

      service['placesServiceReady'].next(true);

      const places = await service.getPointsOfInterest() as GoogleMapLocation[];

      // Assertions for mapping the places to LocationCard objects
      expect(places.length).toBe(1);
      expect(places[0].title).toBe('Restaurant 1');
      expect(places[0].coordinates instanceof google.maps.LatLng).toBeTrue();
      expect(places[0].address).toBe('Address 1');
      expect(places[0].image).toBe('image-url');
    });

    it('should call getPlaces and return operational places', async () => {
      const mockLocation = new google.maps.LatLng(1, 1);
      const mockResults: google.maps.places.PlaceResult[] = [
        {
          business_status: 'OPERATIONAL' as any,
          name: 'Restaurant 1',
          geometry: { location: new google.maps.LatLng(1, 1) },
          vicinity: 'Address 1'
        }
      ];

      placesServiceMock.nearbySearch.and.callFake(
        (
          request: google.maps.places.PlaceSearchRequest,
          callback: (results: google.maps.places.PlaceResult[], status: any) => void
        ) => {
          callback(mockResults, 'OK');
        }
      );

      service['placesServiceReady'].next(true);

      const places = await service['getPlaces'](mockLocation, 250, 'restaurant');

      expect(places.length).toBe(1);
      expect(places[0].name).toBe('Restaurant 1');
    });

    // Test coverage for lines 100-101: Test that placesService is initialized when the service is ready
    it('should initialize placesService when ready', () => {
      service.initialize(mapMock);
      service['placesServiceReady'].next(true);
      expect(service['placesService']).toBeDefined();
      expect(service['placesServiceReady'].getValue()).toBeTrue();
    });

    // Test coverage for lines 80-83: Test the method getPointsOfInterest
    it('should retrieve points of interest using getPointsOfInterest', async () => {
      const mockCampusData = {
        campusKey: {
          coordinates: new google.maps.LatLng(1, 1)
        }
      };
      service['campusData'] = mockCampusData;
      const mockResults: google.maps.places.PlaceResult[] = [
        {
          business_status: 'OPERATIONAL' as any,
          name: 'Restaurant 1',
          geometry: { location: new google.maps.LatLng(1, 1) },
          vicinity: 'Address 1',
          photos: [
            {
              getUrl: () => 'image-url',
              height: 0,
              html_attributions: [],
              width: 0
            }
          ]
        }
      ];

      placesServiceMock.nearbySearch.and.callFake(
        (
          request: google.maps.places.PlaceSearchRequest,
          callback: (results: google.maps.places.PlaceResult[], status: any) => void
        ) => {
          callback(mockResults, 'OK');
        }
      );

      service['placesServiceReady'].next(true);

      const places = await service.getPointsOfInterest();

      expect(places.length).toBe(1);
      expect(places[0].title).toBe('Restaurant 1');
    });

    // Test coverage for failed getPlaces (rejects with error)
    it('should handle failure in getPlaces and return empty array', async () => {
      const mockLocation = new google.maps.LatLng(1, 1);

      // Simulate rejection by mocking getPlaces to reject
      spyOn(service as any, 'getPlaces').and.returnValue(Promise.reject('Failed to get places'));

      // Call getPointsOfInterest and verify that the result is an empty array when failure occurs
      const places = await service.getPointsOfInterest();
      expect(places).toEqual([]);
    });

    // Test coverage for lines 23-25: Ensure campus data is fetched correctly
    it('should fetch campus buildings based on store value', async () => {
      const mockCampusData = {
        campusKey: {
          coordinates: { lat: 1, lng: 1 },
          buildings: [
            {
              name: 'Building 1',
              coordinates: { lat: 1, lng: 1 },
              address: 'Address 1',
              image: 'image1.jpg'
            }
          ]
        }
      };
      storeMock.select.and.returnValue(of('campusKey'));
      service['campusData'] = mockCampusData;
      const buildings = await service.getCampusBuildings();

      expect(buildings.length).toBe(1);
      expect(buildings[0].title).toBe('Building 1');
    });
  });

  /* New Tests for improved coverage */
  describe('Additional tests for improved coverage', () => {
    describe('getPlaceSuggestions', () => {
      it('should return empty array if no campus coordinates are found', async () => {
        service['campusData'] = { campusKey: {} };
        const suggestions = await service.getPlaceSuggestions('any input');
        expect(suggestions).toEqual([]);
      });

      it('should return empty array if AutocompleteService returns an error', async () => {
        service['campusData'] = {
          campusKey: { coordinates: { lat: 1, lng: 1 } }
        };

        const fakeAutocompleteService = {
          getPlacePredictions: jasmine
            .createSpy('getPlacePredictions')
            .and.callFake(
              (
                req: any,
                callback: (
                  predictions: google.maps.places.AutocompletePrediction[] | null,
                  status: string
                ) => void
              ) => {
                callback(null, 'ERROR_STATUS');
              }
            ),
          getQueryPredictions: jasmine
            .createSpy('getQueryPredictions')
            .and.callFake(
              (
                req: any,
                callback: (
                  predictions: google.maps.places.QueryAutocompletePrediction[] | null,
                  status: string
                ) => void
              ) => {
                callback(null, 'ERROR_STATUS');
              }
            )
        };
        spyOn(window.google.maps.places, 'AutocompleteService').and.returnValue(
          fakeAutocompleteService
        );

        const suggestions = await service.getPlaceSuggestions('test');
        expect(suggestions).toEqual([]);
      });

      it('should return suggestions when predictions and details are valid', async () => {
        service['campusData'] = {
          campusKey: { coordinates: { lat: 1, lng: 1 } }
        };

        const fakePrediction = {
          place_id: 'test123',
          structured_formatting: { main_text: 'Test Place' }
        } as google.maps.places.AutocompletePrediction;

        const fakeAutocompleteService = {
          getPlacePredictions: jasmine
            .createSpy('getPlacePredictions')
            .and.callFake(
              (
                req: any,
                callback: (
                  predictions: google.maps.places.AutocompletePrediction[] | null,
                  status: string
                ) => void
              ) => {
                callback([fakePrediction], 'OK');
              }
            ),
          getQueryPredictions: jasmine
            .createSpy('getQueryPredictions')
            .and.callFake(
              (
                req: any,
                callback: (
                  predictions: google.maps.places.QueryAutocompletePrediction[] | null,
                  status: string
                ) => void
              ) => {
                callback(null, 'OK');
              }
            )
        };
        spyOn(window.google.maps.places, 'AutocompleteService').and.returnValue(
          fakeAutocompleteService
        );

        service['placesService'].getDetails = jasmine
          .createSpy('getDetails')
          .and.callFake((request: any, callback: (place: any, status: string) => void) => {
            callback(
              {
                formatted_address: '123 Test St',
                geometry: {
                  location: {
                    lat: () => 1,
                    lng: () => 2
                  }
                }
              },
              'OK'
            );
          });

        const suggestions = await service.getPlaceSuggestions('test') as GoogleMapLocation[];
        expect(suggestions.length).toBe(1);
        expect(suggestions[0].title).toBe('Test Place');
        expect(suggestions[0].address).toBe('123 Test St');
        expect(suggestions[0].coordinates.lat()).toBe(1);
        expect(suggestions[0].coordinates.lng()).toBe(2);
      });

      // it('should return suggestions for buildings with spaces and points of interest', () => {
      //   mappedinService.getCampusMapData.and.returnValue({
      //     'building1': {
      //       abbreviation: 'ABC',
      //       name: 'Main Building',
      //       address: '123 Main St',
      //       mapData: {
      //         getByType: (type: string) => {
      //           if (type === 'space') {
      //             return [{ name: 'Room 101' }, { name: 'Room 102' }];
      //           }
      //           if (type === 'point-of-interest') {
      //             return [{ name: 'Cafe' }, { name: 'Library' }];
      //           }
      //           return [];
      //         }
      //       } as any // Add `as any` if TypeScript complains
      //     }
      //   } as Record<string, BuildingData>);

      //   const buildings = mappedinService.getCampusMapData();
      //   let rooms = [];
    
      //   Object.entries(buildings as BuildingData).forEach(([key, building]) => {
      //     rooms = [
      //       ...rooms,
      //       ...building.mapData?.getByType('space').filter(space => space.name)
      //         .map(space => ({ 
      //           title: `${building.abbreviation} ${space.name}`,
      //           address: building.address,
      //           fullName: `${building.name} ${space.name}`,
      //           abbreviation: building.abbreviation,
      //           indoorMapId: key,
      //           room: space
      //         })),
      //       ...building.mapData?.getByType('point-of-interest').filter(poi => poi.name)
      //         .map(poi => ({ 
      //           title: `${building.abbreviation} ${poi.name}`,
      //           address: building.address,
      //           fullName: `${building.name} ${poi.name}`,
      //           abbreviation: building.abbreviation, 
      //           indoorMapId: key,
      //           room: poi
      //         })),
      //     ];
      //   });

      //   console.log('Rooms: ', rooms)

      //   expect(rooms.length).toBe(4);
      // });
    
      it('should return an empty array when no buildings are available', () => {
        mappedinService.getCampusMapData.and.returnValue({});
        const buildings = mappedinService.getCampusMapData();
        let rooms = [];
    
        Object.entries(buildings as BuildingData).forEach(([key, building]) => {
          rooms = [
            ...rooms,
            ...building.mapData?.getByType('space').filter(space => space.name)
              .map(space => ({
                title: `${building.abbreviation} ${space.name}`,
                address: building.address,
                fullName: `${building.name} ${space.name}`,
                abbreviation: building.abbreviation,
                indoorMapId: key,
                room: space
              })),
            ...building.mapData?.getByType('point-of-interest').filter(poi => poi.name)
              .map(poi => ({
                title: `${building.abbreviation} ${poi.name}`,
                address: building.address,
                fullName: `${building.title} ${poi.name}`,
                abbreviation: building.abbreviation,
                indoorMapId: key,
                room: poi
              })),
          ];
        });
    
        expect(rooms).toEqual([]);
      });
    
      it('should handle buildings with no spaces or points of interest', () => {
        mappedinService.getCampusMapData.and.returnValue({
          'building2': {
            abbreviation: 'XYZ',
            name: 'Empty Building',
            address: '456 Side St',
            mapData: {
              getByType: () => []
            }
          }
        });
    
        const buildings = mappedinService.getCampusMapData();
        let rooms = [];
    
        Object.entries(buildings as BuildingData).forEach(([key, building]) => {
          rooms = [
            ...rooms,
            ...building.mapData?.getByType('space').filter(space => space.name)
              .map(space => ({
                title: `${building.abbreviation} ${space.name}`,
                address: building.address,
                fullName: `${building.name} ${space.name}`,
                abbreviation: building.abbreviation,
                indoorMapId: key,
                room: space
              })),
            ...building.mapData?.getByType('point-of-interest').filter(poi => poi.name)
              .map(poi => ({
                title: `${building.abbreviation} ${poi.name}`,
                address: building.address,
                fullName: `${building.name} ${poi.name}`,
                abbreviation: building.abbreviation,
                indoorMapId: key,
                room: poi
              })),
          ];
        });
    
        expect(rooms).toEqual([]);
      });
    
      it('should handle missing mapData gracefully', () => {
        mappedinService.getCampusMapData.and.returnValue({
          'building3': {
            abbreviation: 'LMN',
            name: 'No Map Data Building',
            address: '789 Another St'
          }
        });
    
        const buildings = mappedinService.getCampusMapData();
        let rooms = [];
    
        Object.entries(buildings as BuildingData).forEach(([key, building]) => {
          if (!building.mapData) return;
          rooms = [
            ...rooms,
            ...building.mapData?.getByType('space').filter(space => space.name)
              .map(space => ({
                title: `${building.abbreviation} ${space.name}`,
                address: building.address,
                fullName: `${building.name} ${space.name}`,
                abbreviation: building.abbreviation,
                indoorMapId: key,
                room: space
              })),
            ...building.mapData?.getByType('point-of-interest').filter(poi => poi.name)
              .map(poi => ({
                title: `${building.abbreviation} ${poi.name}`,
                address: building.address,
                fullName: `${building.name} ${poi.name}`,
                abbreviation: building.abbreviation,
                indoorMapId: key,
                room: poi
              })),
          ];
        });
    
        expect(rooms).toEqual([]);
      });
    });

    describe('getPlaceDetail (private)', () => {
      const fakePrediction = {
        place_id: 'dummy123',
        structured_formatting: { main_text: 'Dummy Place' }
      } as google.maps.places.AutocompletePrediction;

      it('should return null if getDetails callback returns error', async () => {
        service['placesService'].getDetails = jasmine
          .createSpy('getDetails')
          .and.callFake((req: any, callback: (place: any, status: string) => void) => {
            callback(null, 'NOT_OK');
          });
        const detail = await service['getPlaceDetail'](fakePrediction);
        expect(detail).toBeNull();
      });

      it('should return valid detail when getDetails is successful', async () => {
        service['placesService'].getDetails = jasmine
          .createSpy('getDetails')
          .and.callFake((req: any, callback: (place: any, status: string) => void) => {
            callback(
              {
                formatted_address: '456 Success Ave',
                geometry: {
                  location: {
                    lat: () => 3,
                    lng: () => 4
                  }
                }
              },
              'OK'
            );
          });
        const detail = await service['getPlaceDetail'](fakePrediction);
        expect(detail).not.toBeNull();
        if (detail) {
          expect(detail.title).toBe('Dummy Place');
          expect(detail.address).toBe('456 Success Ave');
          expect(detail.coordinates.lat()).toBe(3);
          expect(detail.coordinates.lng()).toBe(4);
        }
      });
    });

    describe('isInitialized', () => {
      it('should emit initialization status changes', (done) => {
        service['placesServiceReady'] = new BehaviorSubject<boolean>(false);

        const emitted: boolean[] = [];
        service.isInitialized().subscribe((status) => {
          emitted.push(status);
          if (emitted.length === 2) {
            expect(emitted).toEqual([false, true]);
            done();
          }
        });
        service['placesServiceReady'].next(true);
      });
    });

    describe('getPlaces (private)', () => {
      it('should reject the promise when status is not OK', async () => {
        const mockLocation = new google.maps.LatLng(1, 1);
        placesServiceMock.nearbySearch.and.callFake(
          (
            req: google.maps.places.PlaceSearchRequest,
            callback: (results: google.maps.places.PlaceResult[], status: string) => void
          ) => {
            callback([], 'ZERO_RESULTS');
          }
        );
        await expectAsync(service['getPlaces'](mockLocation, 250, 'restaurant')).toBeRejectedWith(
          'ZERO_RESULTS'
        );
      });
    });
  });

  describe('New indoor location functionality tests', () => {
    describe('Room pattern detection and floor fallbacks', () => {
      beforeEach(() => {
        // Mock more complex building data with floors and connections
        const mockMapData = {
          getByType: (type: string) => {
            if (type === 'space') {
              return [
                { name: '101', coordinates: { floorId: 'floor1' } },
                { name: '201', coordinates: { floorId: 'floor2' } }
              ];
            } else if (type === 'point-of-interest') {
              return [
                { name: 'Cafe', coordinates: { floorId: 'floor1' } },
                { name: 'Library', coordinates: { floorId: 'floor2' } }
              ];
            } else if (type === 'floor') {
              return [
                { id: 'floor1', name: 'Floor 1' },
                { id: 'floor2', name: 'Floor 2' }
              ];
            } else if (type === 'connection') {
              return [
                {
                  type: 'elevator',
                  coordinates: [
                    { floorId: 'floor1' },
                    { floorId: 'floor2' }
                  ]
                }
              ];
            }
            return [];
          }
        };

        mappedinService.getCampusMapData.and.returnValue({
          'building1': {
            name: 'Hall Building',
            abbreviation: 'H',
            address: '123 Main St',
            coordinates: new google.maps.LatLng(1, 1),
            mapData: mockMapData
          }
        });

        // Set up default campus data
        service['campusData'] = {
          sgw: {
            coordinates: new google.maps.LatLng(1, 1),
            buildings: [
              {
                name: 'Hall Building',
                abbreviation: 'H',
                address: '123 Main St',
                coordinates: { lat: 1, lng: 1 }
              }
            ]
          },
          loy: {
            coordinates: new google.maps.LatLng(2, 2),
            buildings: [
              {
                name: 'Central Building',
                abbreviation: 'CC',
                address: '456 Other St',
                coordinates: { lat: 2, lng: 2 }
              }
            ]
          }
        };

        // Mock building mappings data
        service['buildingMappings'] = {
          'h': ['Hall Building'],
          'hall': ['Hall Building'],
          'cc': ['Central Building'],
          'central': ['Central Building']
        };

        // Mock priority matches
        service['priorityMatches'] = {
          'cc': {
            title: 'Central Building',
            address: '456 Other St',
            coordinates: { lat: 2, lng: 2 },
            campusKey: 'loy'
          }
        };
      });

      it('should detect room pattern (e.g., H-100) correctly', async () => {
        // Mock getDirectBuildingMatch to return null for this test
        spyOn(service as any, 'getDirectBuildingMatch').and.returnValue(null);
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        const suggestions = await service.getPlaceSuggestions('H-101');
        
        // We should have matching results with room matching logic
        expect(suggestions.length).toBeGreaterThan(0);
        
        // Room pattern should be prioritized over building matches
        const firstMatch = suggestions[0] as any;
        expect(firstMatch.type).toBe('indoor');
      });

      it('should attempt to create floor fallbacks when an exact room is not found', async () => {
        // Mock getDirectBuildingMatch to return null for this test
        spyOn(service as any, 'getDirectBuildingMatch').and.returnValue(null);
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        // Create a custom mock with floor data specific to this test
        const mockMapData = {
          getByType: (type: string) => {
            if (type === 'floor') {
              return [
                { id: 'floor9', name: 'Floor 9' }
              ];
            } else if (type === 'space') {
              return [];
            } else if (type === 'connection') {
              return [];
            }
            return [];
          }
        };

        mappedinService.getCampusMapData.and.returnValue({
          'building1': {
            name: 'Hall Building',
            abbreviation: 'H',
            address: '123 Main St',
            coordinates: new google.maps.LatLng(1, 1),
            mapData: mockMapData
          }
        });
        
        // Spy on getRoomMatches to verify it's being called properly
        const roomMatchesSpy = spyOn(service as any, 'getRoomMatches').and.callThrough();
        
        // Create a non-existent room number
        await service.getPlaceSuggestions('H-999');
        
        // Verify that getRoomMatches was called with the right pattern
        expect(roomMatchesSpy).toHaveBeenCalled();
        expect(roomMatchesSpy.calls.mostRecent().args[0]).toContain('999');
      });

      it('should create correct room location object with floor ID', async () => {
        // Access private method for testing
        const space = { name: '101', coordinates: { floorId: 'floor1' } };
        const building = {
          name: 'Hall Building',
          abbreviation: 'H',
          address: '123 Main St',
          coordinates: new google.maps.LatLng(1, 1)
        };
        
        const result = (service as any).createRoomLocation(building, 'building1', space);
        
        expect(result.title).toBe('H 101');
        expect(result.fullName).toBe('Hall Building 101');
        expect(result.type).toBe('indoor');
        expect(result.floorId).not.toBeNull();
      });
    });

    describe('Building match and prioritization tests', () => {
      beforeEach(() => {
        // Set up mock data
        service['campusData'] = {
          sgw: {
            coordinates: new google.maps.LatLng(1, 1),
            buildings: [
              {
                name: 'Hall Building',
                abbreviation: 'H',
                address: '123 Main St',
                coordinates: { lat: 1, lng: 1 }
              },
              {
                name: 'Library Building',
                abbreviation: 'LB',
                address: '789 Library St',
                coordinates: { lat: 1.1, lng: 1.1 }
              }
            ]
          }
        };

        // Mock building mappings
        service['buildingMappings'] = {
          'h': ['Hall Building'],
          'hall': ['Hall Building'],
          'lb': ['Library Building'],
          'library': ['Library Building']
        };

        // Mock priority matches
        service['priorityMatches'] = {
          'cc': {
            title: 'Central Building',
            address: '456 Other St',
            coordinates: { lat: 2, lng: 2 },
            campusKey: 'loy'
          }
        };
      });

      it('should handle building abbreviations correctly', async () => {
        // Mock getDirectBuildingMatch to return null for this test
        spyOn(service as any, 'getDirectBuildingMatch').and.returnValue(null);
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        const suggestions = await service.getPlaceSuggestions('h');
        
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].title).toBe('Hall Building');
      });

      it('should prioritize direct building matches for problematic abbreviations', async () => {
        // Create a mock for buildingMappingsData
        // Since it's imported from a file, we need to create a new mock
        const mockBuildingMappingsData = {
          problematicTerms: ['cc'],
          aliases: {},
          priorityMatches: {}
        };
        // Set it directly in the service
        (service as any).buildingMappingsData = mockBuildingMappingsData;
        
        // Set up the direct building match
        const directMatch = {
          title: 'Central Building',
          address: '456 Other St',
          coordinates: new google.maps.LatLng(2, 2),
          type: 'outdoor'
        };
        
        spyOn(service as any, 'getDirectBuildingMatch').and.returnValue(directMatch);
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        const suggestions = await service.getPlaceSuggestions('cc');
        
        expect(suggestions.length).toBe(1);
        expect(suggestions[0].title).toBe('Central Building');
      });

      it('should combine building matches from exact and broader search', async () => {
        // Mock getDirectBuildingMatch to return null for this test
        spyOn(service as any, 'getDirectBuildingMatch').and.returnValue(null);
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        // Add spy to see the individual match methods called
        const exactMatchSpy = spyOn(service as any, 'getExactBuildingMatch').and.callThrough();
        const buildingSuggestionsSpy = spyOn(service as any, 'getBuildingSuggestions').and.callThrough();
        
        await service.getPlaceSuggestions('lib');
        
        expect(exactMatchSpy).toHaveBeenCalled();
        expect(buildingSuggestionsSpy).toHaveBeenCalled();
      });
    });

    describe('Result prioritization tests', () => {
      beforeEach(() => {
        // Set up mock MappedinService with rooms
        const mockMapData = {
          getByType: (type: string) => {
            if (type === 'space') {
              return [{ name: '101' }, { name: '201' }];
            } else if (type === 'point-of-interest') {
              return [{ name: 'Cafe' }, { name: 'Library' }];
            } else if (type === 'floor') {
              return [
                { id: 'floor1', name: 'Floor 1' },
                { id: 'floor2', name: 'Floor 2' }
              ];
            }
            return [];
          }
        };

        mappedinService.getCampusMapData.and.returnValue({
          'building1': {
            name: 'Hall Building',
            abbreviation: 'H',
            address: '123 Main St',
            coordinates: new google.maps.LatLng(1, 1),
            mapData: mockMapData
          }
        });

        // Set up campus data
        service['campusData'] = {
          sgw: {
            coordinates: new google.maps.LatLng(1, 1),
            buildings: [
              {
                name: 'Hall Building',
                abbreviation: 'H',
                address: '123 Main St',
                coordinates: { lat: 1, lng: 1 }
              }
            ]
          }
        };

        // Mock building mappings
        service['buildingMappings'] = {
          'h': ['Hall Building'],
          'hall': ['Hall Building']
        };
      });

      it('should prioritize indoor locations for room-like inputs', async () => {
        // Mock getDirectBuildingMatch to return null for this test
        spyOn(service as any, 'getDirectBuildingMatch').and.returnValue(null);
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        // Mock Google API to return a result
        const fakePrediction = {
          place_id: 'test123',
          structured_formatting: { main_text: 'Hall Avenue' }
        } as google.maps.places.AutocompletePrediction;

        const fakeAutocompleteService = {
          getPlacePredictions: jasmine
            .createSpy('getPlacePredictions')
            .and.callFake(
              (
                req: any,
                callback: (
                  predictions: google.maps.places.AutocompletePrediction[] | null,
                  status: string
                ) => void
              ) => {
                callback([fakePrediction], 'OK');
              }
            )
        };
        
        spyOn(window.google.maps.places, 'AutocompleteService').and.returnValue(
          fakeAutocompleteService as any
        );

        service['placesService'].getDetails = jasmine
          .createSpy('getDetails')
          .and.callFake((req: any, callback: any) => {
            callback({
              formatted_address: '123 Hall Ave',
              geometry: {
                location: {
                  lat: () => 1,
                  lng: () => 1
                }
              }
            }, 'OK');
          });
        
        // Test with a room-like input
        const roomSuggestions = await service.getPlaceSuggestions('H-101');
        
        // Indoor locations should come first
        expect(roomSuggestions.length).toBeGreaterThan(0);
        expect(roomSuggestions[0].type).toBe('indoor');
        
        // Test with a non-room input
        const generalSuggestions = await service.getPlaceSuggestions('Hall');
        
        // Building (outdoor) matches should come first
        expect(generalSuggestions.length).toBeGreaterThan(0);
        expect(generalSuggestions[0].type).toBe('outdoor');
      });

      it('should handle up to 5 room results', async () => {
        // First, spy on getRoomMatches to modify its behavior
        spyOn(service as any, 'getRoomMatches').and.returnValue([
          { title: 'H 101', type: 'indoor' },
          { title: 'H 102', type: 'indoor' },
          { title: 'H 103', type: 'indoor' },
          { title: 'H 104', type: 'indoor' },
          { title: 'H 105', type: 'indoor' }
        ]);

        // Mock getDirectBuildingMatch to return null for this test
        spyOn(service as any, 'getDirectBuildingMatch').and.returnValue(null);
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        // Get suggestions
        const suggestions = await service.getPlaceSuggestions('H10');
        
        // Should handle up to 5 results
        expect(suggestions.length).toBe(5);
      });
    });

    describe('Error handling tests', () => {
      it('should handle missing campus data gracefully', async () => {
        // Set up incomplete campus data
        service['campusData'] = {};
        
        // Set the store to return a non-existent campus
        storeMock.select.and.returnValue(of('nonexistent'));
        
        const suggestions = await service.getPlaceSuggestions('test');
        
        // Should handle gracefully and return empty array
        expect(suggestions).toEqual([]);
      });

      it('should handle missing buildingMappings gracefully', async () => {
        // Remove building mappings
        service['buildingMappings'] = undefined;
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        const suggestions = await service.getPlaceSuggestions('test');
        
        // Should handle gracefully and continue execution
        expect(suggestions).toBeDefined();
      });

      it('should handle missing priorityMatches gracefully', async () => {
        // Remove priority matches
        service['priorityMatches'] = undefined;
        
        // Set the store to return sgw campus
        storeMock.select.and.returnValue(of('sgw'));
        
        // Should not throw errors
        await expectAsync(service.getPlaceSuggestions('cc')).toBeResolved();
      });
    });
  });
});
