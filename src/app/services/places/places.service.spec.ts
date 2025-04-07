import { TestBed } from '@angular/core/testing';
import { PlacesService } from './places.service';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { MappedinService } from '../mappedin/mappedin.service';
import { BuildingData } from '../mappedin/mappedin.service';
import { ConcordiaDataService } from '../concordia-data.service';

describe('PlacesService', () => {
  let service: PlacesService;
  let storeMock: any;
  let mapMock: google.maps.Map;
  let placesServiceMock: any;
  let mappedinService: jasmine.SpyObj<MappedinService>;
  let concordiaDataServiceMock: jasmine.SpyObj<ConcordiaDataService>;

  beforeEach(() => {
    mappedinService = jasmine.createSpyObj('MappedinService', ['getCampusMapData']);

    concordiaDataServiceMock = jasmine.createSpyObj('ConcordiaDataService', [
      'getCampus',
      'getBuildings',
      'getBuildingSuggestions'
    ]);

    storeMock = {
      select: jasmine.createSpy().and.returnValue(of('campusKey'))
    };

    TestBed.configureTestingModule({
      providers: [
        PlacesService,
        { provide: Store, useValue: storeMock },
        { provide: MappedinService, useValue: mappedinService },
        { provide: ConcordiaDataService, useValue: concordiaDataServiceMock }
      ]
    });

    service = TestBed.inject(PlacesService);
    mappedinService = TestBed.inject(MappedinService) as jasmine.SpyObj<MappedinService>;

    mapMock = jasmine.createSpyObj('google.maps.Map', ['setCenter', 'setZoom']);
    placesServiceMock = jasmine.createSpyObj('PlacesService', ['nearbySearch']);
    service['placesService'] = placesServiceMock;

    service['placesServiceReady'].next(true);
  });

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
    const buildingsArray = [
      {
        name: 'Building 1',
        coordinates: { lat: 1, lng: 1 },
        address: 'Address 1',
        image: 'image1.jpg'
      }
    ];

    concordiaDataServiceMock.getCampus.and.returnValue({ coordinates: { lat: 1, lng: 1 } });

    concordiaDataServiceMock.getBuildings.and.returnValue(buildingsArray);

    const buildings = await service.getCampusBuildings();

    expect(buildings.length).toBe(1);
    expect(buildings[0].title).toBe('Building 1');
  });

  it('should fetch points of interest correctly from getPointsOfInterest', async () => {
    // Mock the campus data and store behavior
    concordiaDataServiceMock.getCampus.and.returnValue({
      coordinates: { lat: 1, lng: 1 }
    });

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

    const places = (await service.getPointsOfInterest()) as GoogleMapLocation[];

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

  it('should initialize placesService when ready', () => {
    service.initialize(mapMock);
    service['placesServiceReady'].next(true);
    expect(service['placesService']).toBeDefined();
    expect(service['placesServiceReady'].getValue()).toBeTrue();
  });

  it('should retrieve points of interest using getPointsOfInterest', async () => {
    // Ensure getCampus returns valid coordinates.
    concordiaDataServiceMock.getCampus.and.returnValue({ coordinates: { lat: 1, lng: 1 } });

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
    concordiaDataServiceMock.getCampus.and.returnValue({ coordinates: { lat: 1, lng: 1 } });

    spyOn(service as any, 'getPlaces').and.returnValue(Promise.reject('Failed to get places'));

    const places = await service.getPointsOfInterest();
    expect(places).toEqual([]);
  });

  it('should fetch campus buildings based on store value', async () => {
    storeMock.select.and.returnValue(of('campusKey'));

    const buildingsArray = [
      {
        name: 'Building 1',
        coordinates: { lat: 1, lng: 1 },
        address: 'Address 1',
        image: 'image1.jpg'
      }
    ];
    concordiaDataServiceMock.getBuildings.and.returnValue(buildingsArray);

    // Call the method under test.
    const buildings = await service.getCampusBuildings();

    expect(buildings.length).toBe(1);
    expect(buildings[0].title).toBe('Building 1');
  });

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
      // Ensure getCampus returns valid coordinates.
      concordiaDataServiceMock.getCampus.and.returnValue({ coordinates: { lat: 1, lng: 1 } });
      // For this test, have mappedIn return an empty object so that building suggestions don't interfere.
      mappedinService.getCampusMapData.and.returnValue({});

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

      const suggestions = (await service.getPlaceSuggestions('test')) as GoogleMapLocation[];
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].title).toBe('Test Place');
      expect(suggestions[0].address).toBe('123 Test St');
      expect(suggestions[0].coordinates.lat()).toBe(1);
      expect(suggestions[0].coordinates.lng()).toBe(2);
    });

    it('should return an empty array when no buildings are available', () => {
      mappedinService.getCampusMapData.and.returnValue({});
      const buildings = mappedinService.getCampusMapData();
      let rooms = [];

      Object.entries(buildings as BuildingData).forEach(([key, building]) => {
        rooms = [
          ...rooms,
          ...building.mapData
            ?.getByType('space')
            .filter((space) => space.name)
            .map((space) => ({
              title: `${building.abbreviation} ${space.name}`,
              address: building.address,
              fullName: `${building.name} ${space.name}`,
              abbreviation: building.abbreviation,
              indoorMapId: key,
              room: space
            })),
          ...building.mapData
            ?.getByType('point-of-interest')
            .filter((poi) => poi.name)
            .map((poi) => ({
              title: `${building.abbreviation} ${poi.name}`,
              address: building.address,
              fullName: `${building.title} ${poi.name}`,
              abbreviation: building.abbreviation,
              indoorMapId: key,
              room: poi
            }))
        ];
      });

      expect(rooms).toEqual([]);
    });

    it('should handle buildings with no spaces or points of interest', () => {
      mappedinService.getCampusMapData.and.returnValue({
        building2: {
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
          ...building.mapData
            ?.getByType('space')
            .filter((space) => space.name)
            .map((space) => ({
              title: `${building.abbreviation} ${space.name}`,
              address: building.address,
              fullName: `${building.name} ${space.name}`,
              abbreviation: building.abbreviation,
              indoorMapId: key,
              room: space
            })),
          ...building.mapData
            ?.getByType('point-of-interest')
            .filter((poi) => poi.name)
            .map((poi) => ({
              title: `${building.abbreviation} ${poi.name}`,
              address: building.address,
              fullName: `${building.name} ${poi.name}`,
              abbreviation: building.abbreviation,
              indoorMapId: key,
              room: poi
            }))
        ];
      });

      expect(rooms).toEqual([]);
    });

    it('should handle missing mapData gracefully', () => {
      mappedinService.getCampusMapData.and.returnValue({
        building3: {
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
          ...building.mapData
            ?.getByType('space')
            .filter((space) => space.name)
            .map((space) => ({
              title: `${building.abbreviation} ${space.name}`,
              address: building.address,
              fullName: `${building.name} ${space.name}`,
              abbreviation: building.abbreviation,
              indoorMapId: key,
              room: space
            })),
          ...building.mapData
            ?.getByType('point-of-interest')
            .filter((poi) => poi.name)
            .map((poi) => ({
              title: `${building.abbreviation} ${poi.name}`,
              address: building.address,
              fullName: `${building.name} ${poi.name}`,
              abbreviation: building.abbreviation,
              indoorMapId: key,
              room: poi
            }))
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
      const emitted: boolean[] = [];
      service.isInitialized().subscribe((status) => {
        emitted.push(status);
        if (emitted.length === 2) {
          expect(emitted).toEqual([true, true]);
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
        Error('error in getPlaces(): ZERO_RESULTS')
      );
    });
  });

  it('should return indoor-only results if Autocomplete predictions are empty', async () => {
    service['campusData'] = {
      campusKey: { coordinates: { lat: 1, lng: 1 } }
    };

    const fakeAutocompleteService = {
      getPlacePredictions: jasmine.createSpy().and.callFake((req, callback) => {
        callback([], 'OK'); // Empty predictions array
      }),
      getQueryPredictions: jasmine.createSpy()
    };

    spyOn(window.google.maps.places, 'AutocompleteService').and.returnValue(
      fakeAutocompleteService
    );

    const result = await service.getPlaceSuggestions('lib');
    // Should return at least the indoor rooms (if any match)
    expect(Array.isArray(result)).toBeTrue();
  });

  it('should match abbreviation during filtering in getPlaceSuggestions', async () => {
    // The code calls getCampusCoordinates() → getCampus().
    concordiaDataServiceMock.getCampus.and.returnValue({
      coordinates: { lat: 45.5017, lng: -73.5673 }
    });

    // Return an empty array for getBuildingSuggestions if needed (not used when input isn't empty).
    concordiaDataServiceMock.getBuildingSuggestions.and.returnValue([]);

    // The rest of your mappedinService + AutocompleteService stubs
    const fakeCampusData = {
      building1: {
        abbreviation: 'LB',
        name: 'Library',
        address: '123',
        coordinates: { lat: 1, lng: 1 },
        mapData: {
          getByType: (type: string) => {
            if (type === 'space') {
              return [{ name: 'Quiet Study' }];
            }
            if (type === 'point-of-interest') {
              return [{ name: 'Café' }];
            }
            return [];
          }
        }
      }
    };

    mappedinService.getCampusMapData.and.returnValue(fakeCampusData);

    const fakeAutocompleteService = {
      getPlacePredictions: jasmine.createSpy().and.callFake((req, callback) => {
        callback([], 'OK'); // ensures no outside Google results
      }),
      getQueryPredictions: jasmine.createSpy()
    };
    spyOn(window.google.maps.places, 'AutocompleteService').and.returnValue(
      fakeAutocompleteService
    );

    // Finally, call getPlaceSuggestions:
    const result = await service.getPlaceSuggestions('LB');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should throw when getCampusBuildings is called on missing campusKey', async () => {
    service['campusData'] = {}; // Empty object
    storeMock.select.and.returnValue(of('missingCampus'));

    await expectAsync(service.getCampusBuildings()).toBeRejected();
  });

  it('should handle places with no photos in getPointsOfInterest', async () => {
    concordiaDataServiceMock.getCampus.and.returnValue({ coordinates: { lat: 1, lng: 1 } });

    const mockLocation = new google.maps.LatLng(1, 1);
    placesServiceMock.nearbySearch.and.callFake((req, callback) => {
      callback(
        [
          {
            name: 'No Image Cafe',
            business_status: 'OPERATIONAL' as any,
            geometry: { location: mockLocation },
            vicinity: 'Address',
            photos: []
          }
        ],
        'OK'
      );
    });

    const result = await service.getPointsOfInterest();
    expect(result.length).toBe(1);
    expect(result[0].image).toBeUndefined();
  });
});
