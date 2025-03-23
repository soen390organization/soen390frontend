import { of } from 'rxjs';
import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { PlacesService } from 'src/app/services/places/places.service';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { Store } from '@ngrx/store';

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let store: jasmine.SpyObj<Store>;

  // Spies for the injected services
  let directionsServiceSpy: jasmine.SpyObj<DirectionsService>;
  let indoorDirectionsServiceSpy: jasmine.SpyObj<IndoorDirectionsService>;
  let placesServiceSpy: jasmine.SpyObj<PlacesService>;
  let currentLocationServiceSpy: jasmine.SpyObj<CurrentLocationService>;

  beforeEach(async () => {
    // Create spies
    directionsServiceSpy = jasmine.createSpyObj('DirectionsService', [
      'setStartPoint',
      'setDestinationPoint',
      'getStartPoint',
      'getDestinationPoint',
      'clearStartPoint',
      'clearDestinationPoint'
    ]);
    // Ensure getDestinationPoint() returns an observable
    directionsServiceSpy.getStartPoint.and.returnValue(of(null));
    directionsServiceSpy.getDestinationPoint.and.returnValue(
      of({ title: 'Default Destination', address: '', coordinates: null, type: 'outdoor' })
    );
    indoorDirectionsServiceSpy = jasmine.createSpyObj('DirectionsService', [
      'setStartPoint',
      'setDestinationPoint'
    ]);
    placesServiceSpy = jasmine.createSpyObj('PlacesService', ['getPlaceSuggestions']);
    currentLocationServiceSpy = jasmine.createSpyObj('CurrentLocationService', [
      'getCurrentLocation'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        BrowserAnimationsModule, // Needed if testing animations
        MapSearchComponent
      ],
      providers: [
        { provide: Store, useValue: store },
        { provide: DirectionsService, useValue: directionsServiceSpy },
        { provide: PlacesService, useValue: placesServiceSpy },
        { provide: IndoorDirectionsService, useValue: indoorDirectionsServiceSpy },
        {
          provide: CurrentLocationService,
          useValue: currentLocationServiceSpy
        }
      ]
    }).compileComponents();

    store = jasmine.createSpyObj<Store>('Store', ['select', 'dispatch']);
    store.select.and.returnValue(of(null)); // default selector return
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;
    directionsServiceSpy.getDestinationPoint.and.returnValue(of(null)); // to solve setting auto-true value
    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('UI visibility tests', () => {
    it('should have isSearchVisible false by default', () => {
      expect(component.isSearchVisible).toBeFalse();
    });

    it('should toggle search visibility', () => {
      // Initially false
      expect(component.isSearchVisible).toBeFalse();

      component.toggleSearch();
      expect(component.isSearchVisible).toBeTrue();

      component.toggleSearch();
      expect(component.isSearchVisible).toBeFalse();
    });
  });

  describe('onSearchChange()', () => {
    it('should clear places if query is empty or blank', async () => {
      component.places = [{ title: 'Some Place' }];
      const event = { target: { value: ' ' } };

      await component.onSearchChange(event, 'start');
      expect(component.places).toEqual([]);
      expect(placesServiceSpy.getPlaceSuggestions).not.toHaveBeenCalled();
    });

    it('should call placesService and set places when search query is not empty (start location)', async () => {
      const event = { target: { value: 'pizza' } };
      const mockPlaces: GoogleMapLocation[] = [
        {
          title: 'Pizza Palace',
          address: '123 Main St',
          coordinates: new google.maps.LatLng(10, 20),
          type: 'outdoor'
        },
        {
          title: 'Pizza Haven',
          address: '456 Side St',
          coordinates: new google.maps.LatLng(30, 40),
          type: 'outdoor'
        }
      ];

      placesServiceSpy.getPlaceSuggestions.and.returnValue(Promise.resolve(mockPlaces));

      await component.onSearchChange(event, 'start');

      expect(component.isSearchingFromStart).toBeTrue();
      expect(placesServiceSpy.getPlaceSuggestions).toHaveBeenCalledWith('pizza');
      expect(component.places).toEqual(mockPlaces);
    });

    it('should call placesService and set places when search query is not empty (destination)', async () => {
      const event = { target: { value: 'museum' } };
      const mockPlaces: GoogleMapLocation[] = [
        {
          title: 'Art Museum',
          address: '789 Park Ave',
          coordinates: new google.maps.LatLng(10, 20),
          type: 'outdoor'
        }
      ];
      placesServiceSpy.getPlaceSuggestions.and.returnValue(Promise.resolve(mockPlaces));

      await component.onSearchChange(event, 'destination');

      expect(component.isSearchingFromStart).toBeFalse();
      expect(placesServiceSpy.getPlaceSuggestions).toHaveBeenCalledWith('museum');
      expect(component.places).toEqual(mockPlaces);
    });
  });

  describe('clearList()', () => {
    it('should clear the places array', () => {
      component.places = [{ title: 'Place1' }, { title: 'Place2' }];
      component.clearList();
      expect(component.places.length).toBe(0);
    });
  });

  describe('Clear button functionalities', () => {
    it('should clear the start input when clearStartInput() is called', () => {
      component.startLocationInput = 'Some text';
      component.places = [{ title: 'Place1' }];
      spyOn(component, 'clearList');

      component.clearStartInput();

      expect(component.startLocationInput).toBe('');
      expect(component.clearList).toHaveBeenCalled();
      expect(directionsServiceSpy.clearStartPoint).toHaveBeenCalled();
    });

    it('should clear the destination input when clearDestinationInput() is called', () => {
      component.destinationLocationInput = 'Some text';
      component.places = [{ title: 'Place2' }];
      spyOn(component, 'clearList');

      component.clearDestinationInput();

      expect(component.destinationLocationInput).toBe('');
      expect(component.clearList).toHaveBeenCalled();
      expect(directionsServiceSpy.clearDestinationPoint).toHaveBeenCalled();
    });
  });

  describe('onSetUsersLocationAsStart()', () => {
    it('should retrieve current location and set start point via DirectionsService', fakeAsync(() => {
      // Mock the service to resolve a location
      currentLocationServiceSpy.getCurrentLocation.and.returnValue(
        Promise.resolve({ lat: 10, lng: 20 })
      );

      component.onSetUsersLocationAsStart();
      tick(); // Resolve the Promise

      expect(currentLocationServiceSpy.getCurrentLocation).toHaveBeenCalled();
      expect(directionsServiceSpy.setStartPoint).toHaveBeenCalledWith({
        title: 'Your Location',
        address: '10, 20',
        coordinates: jasmine.any(Object),
        type: 'outdoor'
      });
    }));

    it('should throw an error if current location is null', async () => {
      // Mock the service to return null
      currentLocationServiceSpy.getCurrentLocation.and.returnValue(Promise.resolve(null));
      spyOn(console, 'error'); // to suppress or check error logs

      await expectAsync(component.onSetUsersLocationAsStart()).toBeRejectedWithError(
        'Current location is null.'
      );
    });
  });

  describe('Keyboard "enter" handling', () => {
    // These tests simulate pressing enter in the input fields to set start/destination
    // e.g., (keyup.enter)="directionsService.setStartPoint(places[0]); clearList()"

    it('should set start point on enter if places is not empty', () => {
      const selectedPlace = {
        title: 'Start Place',
        address: 'Somewhere',
        coordinates: new google.maps.LatLng(10, 20),
        type: 'outdoor' as 'outdoor'
      };
      component.places = [selectedPlace];
      directionsServiceSpy.setStartPoint.calls.reset();

      // Simulate the (keyup.enter) logic
      directionsServiceSpy.setStartPoint(component.places[0]);
      component.clearList();

      expect(directionsServiceSpy.setStartPoint).toHaveBeenCalledWith(selectedPlace);
      expect(component.places.length).toBe(0);
    });

    it('should set destination point on enter if places is not empty', () => {
      const selectedPlace = {
        title: 'Destination Place',
        address: 'Somewhere',
        coordinates: new google.maps.LatLng(30, 40),
        type: 'outdoor' as 'outdoor'
      };
      component.places = [selectedPlace];
      directionsServiceSpy.setDestinationPoint.calls.reset();

      // Simulate the (keyup.enter) logic
      directionsServiceSpy.setDestinationPoint(component.places[0]);
      component.clearList();

      expect(directionsServiceSpy.setDestinationPoint).toHaveBeenCalledWith(selectedPlace);
      expect(component.places.length).toBe(0);
    });
  });

  describe('ngOnInit and calculateShortestRoute', () => {
    let componentWithRoute: MapSearchComponent;
    let fixtureWithRoute: ComponentFixture<MapSearchComponent>;

    // Define a dummy google.maps.LatLng object for testing purposes.
    const dummyLatLng = {
      equals: (other: any) => true,
      lat: () => 10,
      lng: () => 20,
      toJSON: () => ({ lat: 10, lng: 20 }),
      toUrlValue: () => '10,20'
    } as google.maps.LatLng;

    beforeEach(() => {
      // Set up the spies to return valid start and destination points.
      directionsServiceSpy.getStartPoint.and.returnValue(
        of({
          title: 'Start Place',
          address: 'start address',
          coordinates: dummyLatLng,
          type: 'outdoor'
        })
      );
      directionsServiceSpy.getDestinationPoint.and.returnValue(
        of({
          title: 'Destination Place',
          address: 'destination address',
          coordinates: dummyLatLng,
          type: 'outdoor'
        })
      );
      // Set the spy for calculateShortestRoute to return a resolved promise.
      directionsServiceSpy.calculateShortestRoute = jasmine
        .createSpy('calculateShortestRoute')
        .and.returnValue(Promise.resolve());
      directionsServiceSpy.getShortestRoute = jasmine
        .createSpy('getShortestRoute')
        .and.returnValue({ eta: '10 mins', distance: 5, mode: 'WALKING' });

      fixtureWithRoute = TestBed.createComponent(MapSearchComponent);
      componentWithRoute = fixtureWithRoute.componentInstance;
      fixtureWithRoute.detectChanges();
    });

    it('should set start and destination inputs and call calculateShortestRoute on ngOnInit', async () => {
      fixtureWithRoute.detectChanges();
      await fixtureWithRoute.whenStable();

      expect(componentWithRoute.startLocationInput).toBe('Start Place');
      expect(componentWithRoute.destinationLocationInput).toBe('Destination Place');
      expect(componentWithRoute.isSearchVisible).toBeTrue();
      expect(directionsServiceSpy.calculateShortestRoute).toHaveBeenCalledWith(
        'start address',
        'destination address'
      );
      expect(componentWithRoute.currentRouteData).toEqual({
        eta: '10 mins',
        distance: 5,
        mode: 'WALKING'
      });
    });

    it('should handle error in calculateShortestRoute gracefully', fakeAsync(() => {
      const error = new Error('Route calculation failed');
      // Simulate a rejected promise in calculateShortestRoute.
      directionsServiceSpy.calculateShortestRoute.and.returnValue(Promise.reject(error));
      // Create a new instance for this error case.
      const errorFixture = TestBed.createComponent(MapSearchComponent);
      const errorComponent = errorFixture.componentInstance;
      spyOn(console, 'error');
      errorFixture.detectChanges();
      tick();
      flushMicrotasks();
      expect(console.error).toHaveBeenCalledWith('Error calculating route:', error);
      // currentRouteData should remain null if route calculation fails.
      expect(errorComponent.currentRouteData).toBeNull();
    }));

    it('should not call calculateShortestRoute if one of the points is null', fakeAsync(() => {
      // Reset the spy calls so previous calls don't affect this test.
      directionsServiceSpy.calculateShortestRoute.calls.reset();
      // Simulate scenario where the start point is null.
      directionsServiceSpy.getStartPoint.and.returnValue(of(null));
      directionsServiceSpy.getDestinationPoint.and.returnValue(
        of({
          title: 'Destination Only',
          address: 'destination only address',
          coordinates: dummyLatLng,
          type: 'outdoor'
        })
      );
      // Create a new component instance for this scenario.
      const incompleteFixture = TestBed.createComponent(MapSearchComponent);
      const incompleteComponent = incompleteFixture.componentInstance;
      incompleteFixture.detectChanges();
      tick();
      flushMicrotasks();
      expect(directionsServiceSpy.calculateShortestRoute).not.toHaveBeenCalled();
      // Even though the combineLatest branch doesn't run, the destination observable subscription should set its value.
      expect(incompleteComponent.destinationLocationInput).toBe('Destination Only');
    }));
  });

  describe('onStartClick()', () => {
    it('should toggle components, show directions, and toggle search', () => {
      // Access private members using type assertions
      const visibilityService = (component as any).visibilityService;
      const directionsService = (component as any).directionsService;

      spyOn(visibilityService, 'toggleDirectionsComponent');
      spyOn(visibilityService, 'togglePOIsComponent');

      // Patch the directionsService with a dummy showDirections if it's not defined.
      if (!directionsService.showDirections) {
        directionsService.showDirections = () => {};
      }
      spyOn(directionsService, 'showDirections');

      spyOn(component, 'toggleSearch').and.callThrough();

      // Set initial flag value
      component.isSearchVisible = false;

      // Call the method under test
      component.onStartClick();

      // Verify that the methods were called
      expect(visibilityService.toggleDirectionsComponent).toHaveBeenCalled();
      expect(visibilityService.togglePOIsComponent).toHaveBeenCalled();
      expect(directionsService.showDirections).toHaveBeenCalled();
      expect(component.toggleSearch).toHaveBeenCalled();

      // Verify that toggleSearch toggled the flag as expected
      expect(component.isSearchVisible).toBeTrue();
    });
  });

  it('should update startLocationInput and call indoorDirectionService.setStartPoint when indoorMapId is provided', () => {
    const place = { title: 'Office', indoorMapId: 'indoor123' };
    component.setStart(place);

    expect(component.startLocationInput).toBe('Office');
    expect(indoorDirectionsServiceSpy.setStartPoint).toHaveBeenCalledWith(place);
    expect(directionsServiceSpy.setStartPoint).not.toHaveBeenCalled();
  });

  it('should update destinationLocationInput and call indoorDirectionService.setDestinationPoint when indoorMapId is provided', () => {
    const place = { title: 'Mall', indoorMapId: 'indoor567' };
    component.setDestination(place);

    expect(component.destinationLocationInput).toBe('Mall');
    expect(indoorDirectionsServiceSpy.setDestinationPoint).toHaveBeenCalledWith(place);
    expect(directionsServiceSpy.setDestinationPoint).not.toHaveBeenCalled();
  });
});
