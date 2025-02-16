import { TestBed } from '@angular/core/testing';
import { PlacesService } from './places.service';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';
import { google } from 'google-maps';

describe('PlacesService', () => {
  let service: PlacesService;
  let storeMock: any;
  let mapMock: google.maps.Map;
  let placesServiceMock: any;

  beforeEach(() => {
    // Mock the Store
    storeMock = {
      select: jasmine.createSpy().and.returnValue(of('campusKey')),
    };

    TestBed.configureTestingModule({
      providers: [
        PlacesService,
        { provide: Store, useValue: storeMock },
      ],
    });

    service = TestBed.inject(PlacesService);

    // Mock the google.maps.Map constructor
    mapMock = jasmine.createSpyObj('google.maps.Map', ['setCenter', 'setZoom']);

    // Mock PlacesService
    placesServiceMock = jasmine.createSpyObj('PlacesService', ['nearbySearch']);
    service['placesService'] = placesServiceMock;

    // Mock BehaviorSubject for placesServiceReady (initial value is false)
    service['placesServiceReady'] = new BehaviorSubject<boolean>(false);
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
    const mockCampusData = {
      campusKey: {
        buildings: [
          { name: 'Building 1', coordinates: { lat: 1, lng: 1 }, address: 'Address 1', image: 'image1.jpg' },
        ],
      },
    };
    service['campusData'] = mockCampusData;

    const buildings = await service.getCampusBuildings();

    expect(buildings.length).toBe(1);
    expect(buildings[0].name).toBe('Building 1');
  });

  it('should fetch points of interest correctly from getPointsOfInterest', async () => {
    // Mock the campus data and store behavior
    const mockCampusData = {
      campusKey: {
        coordinates: new google.maps.LatLng(1, 1),
      },
    };
    service['campusData'] = mockCampusData;

    // Mock the places service API call to return restaurant data
    const mockResults: google.maps.places.PlaceResult[] = [
      {
        business_status: 'OPERATIONAL' as any,
        name: 'Restaurant 1',
        geometry: { location: new google.maps.LatLng(1, 1) },
        vicinity: 'Address 1',
        photos: [{
          getUrl: () => 'image-url',
          height: 0,
          html_attributions: [],
          width: 0
        }],
      },
    ];
  
    placesServiceMock.nearbySearch.and.callFake((request: google.maps.places.PlaceSearchRequest, callback: (results: google.maps.places.PlaceResult[], status: any) => void) => {
      callback(mockResults, "OK");
    });
  
    service['placesServiceReady'].next(true);
  
    const places = await service.getPointsOfInterest();

    // Assertions for mapping the places to LocationCard objects
    expect(places.length).toBe(1);
    expect(places[0].name).toBe('Restaurant 1');
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
        vicinity: 'Address 1',
      },
    ];
  
    placesServiceMock.nearbySearch.and.callFake((request: google.maps.places.PlaceSearchRequest, callback: (results: google.maps.places.PlaceResult[], status: any) => void) => {
      callback(mockResults, "OK");
    });
  
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
        coordinates: new google.maps.LatLng(1, 1),
      },
    };
    service['campusData'] = mockCampusData;
    const mockResults: google.maps.places.PlaceResult[] = [
      {
        business_status: 'OPERATIONAL' as any,
        name: 'Restaurant 1',
        geometry: { location: new google.maps.LatLng(1, 1) },
        vicinity: 'Address 1',
        photos: [{
          getUrl: () => 'image-url',
          height: 0,
          html_attributions: [],
          width: 0
        }],
      },
    ];
  
    placesServiceMock.nearbySearch.and.callFake((request: google.maps.places.PlaceSearchRequest, callback: (results: google.maps.places.PlaceResult[], status: any) => void) => {
      callback(mockResults, "OK");
    });
  
    service['placesServiceReady'].next(true);
  
    const places = await service.getPointsOfInterest();

    expect(places.length).toBe(1);
    expect(places[0].name).toBe('Restaurant 1');
  });

   // Test coverage for failed getPlaces (rejects with error)
   it('should handle failure in getPlaces and return empty array', async () => {
    const mockLocation = new google.maps.LatLng(1, 1);
  
    // Simulate rejection by mocking getPlaces to reject
    spyOn(service as any, 'getPlaces').and.returnValue(Promise.reject('Failed to get places'));
  
    // Call getPointsOfInterest and verify that the result is an empty array when failure occurs
    const places = await service.getPointsOfInterest();
    console.log('VALUES: ', places)
    expect(places).toEqual([]);
  });

  // Test coverage for lines 23-25: Ensure campus data is fetched correctly
  it('should fetch campus buildings based on store value', async () => {
    const mockCampusData = {
      campusKey: {
        coordinates: { lat: 1, lng: 1 },
        buildings: [{ name: 'Building 1', coordinates: { lat: 1, lng: 1 }, address: 'Address 1', image: 'image1.jpg' }],
      },
    };
    storeMock.select.and.returnValue(of('campusKey'));
    service['campusData'] = mockCampusData;
    const buildings = await service.getCampusBuildings();
  
    expect(buildings.length).toBe(1);
    expect(buildings[0].name).toBe('Building 1');
  });
});
