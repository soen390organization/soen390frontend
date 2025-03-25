import { of } from 'rxjs';
import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/* Services */
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { PlacesService } from 'src/app/services/places/places.service';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { VisibilityService } from 'src/app/services/visibility.service';

/* Interfaces */
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

/* Store utils */
import { Store } from '@ngrx/store';
import { setMapType, MapType } from 'src/app/store/app';

/* Other */
import { HomePage } from 'src/app/home/home.page';

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let store: jasmine.SpyObj<Store<any>>;

  // Spies for the injected services
  let directionsServiceSpy: jasmine.SpyObj<DirectionsService>;
  let indoorDirectionsServiceSpy: jasmine.SpyObj<IndoorDirectionsService>;
  let placesServiceSpy: jasmine.SpyObj<PlacesService>;
  let currentLocationServiceSpy: jasmine.SpyObj<CurrentLocationService>;
  let mappedInServiceSpy: jasmine.SpyObj<MappedinService>;
  let coordinatorSpy: jasmine.SpyObj<NavigationCoordinatorService>;
  let visibilityServiceFake: any; // custom fake with enableStart property

  beforeEach(async () => {
    // Create spies for DirectionsService with required methods.
    directionsServiceSpy = jasmine.createSpyObj('DirectionsService', [
      'setStartPoint',
      'setDestinationPoint',
      'getStartPoint',
      'getDestinationPoint',
      'clearStartPoint',
      'clearDestinationPoint',
      'calculateShortestRoute',
      'getShortestRoute'
    ]);
    directionsServiceSpy.getStartPoint.and.returnValue(of(null));
    directionsServiceSpy.getDestinationPoint.and.returnValue(
      of({ title: 'Default Destination', address: '', coordinates: null, type: 'outdoor' })
    );

    // Create spy for IndoorDirectionsService.
    indoorDirectionsServiceSpy = jasmine.createSpyObj('IndoorDirectionsService', [
      'setStartPoint',
      'setDestinationPoint',
      'getStartPoint',
      'getDestinationPoint',
      'clearStartPoint',
      'clearDestinationPoint'
    ]);
    indoorDirectionsServiceSpy.getStartPoint.and.returnValue(of(null));
    indoorDirectionsServiceSpy.getDestinationPoint.and.returnValue(of(null));

    placesServiceSpy = jasmine.createSpyObj('PlacesService', ['getPlaceSuggestions']);
    currentLocationServiceSpy = jasmine.createSpyObj('CurrentLocationService', [
      'getCurrentLocation'
    ]);

    mappedInServiceSpy = jasmine.createSpyObj('MappedinService', ['getMapId', 'setMapData']);
    // For testing, assume the default map id is 'defaultMap'
    mappedInServiceSpy.getMapId.and.returnValue('defaultMap');

    coordinatorSpy = jasmine.createSpyObj('NavigationCoordinatorService', ['getCompleteRoute']);
    // Return a valid CompleteRoute (with segments array) for the coordinator.
    coordinatorSpy.getCompleteRoute.and.returnValue(
      Promise.resolve({ segments: [{ type: 'indoor', instructions: 'dummy instructions' }] })
    );

    // Create a custom fake for VisibilityService with an enableStart property.
    visibilityServiceFake = {
      toggleDirectionsComponent: jasmine.createSpy('toggleDirectionsComponent'),
      togglePOIsComponent: jasmine.createSpy('togglePOIsComponent'),
      toggleStartButton: jasmine.createSpy('toggleStartButton'),
      triggerEndNavigation: jasmine.createSpy('triggerEndNavigation'),
      enableStart: of(true)
    };

    store = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    store.select.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        BrowserAnimationsModule,
        MapSearchComponent
      ],
      providers: [
        { provide: Store, useValue: store },
        { provide: DirectionsService, useValue: directionsServiceSpy },
        { provide: PlacesService, useValue: placesServiceSpy },
        { provide: IndoorDirectionsService, useValue: indoorDirectionsServiceSpy },
        { provide: CurrentLocationService, useValue: currentLocationServiceSpy },
        { provide: MappedinService, useValue: mappedInServiceSpy },
        { provide: NavigationCoordinatorService, useValue: coordinatorSpy },
        { provide: VisibilityService, useValue: visibilityServiceFake }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;
    // Reset destination to null by default.
    directionsServiceSpy.getDestinationPoint.and.returnValue(of(null));
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
      // Stub HomePage prototype methods to avoid side effects.
      spyOn(HomePage.prototype, 'showSearch');
      spyOn(HomePage.prototype, 'hideSearch');

      expect(component.isSearchVisible).toBeFalse();

      component.toggleSearch();
      expect(component.isSearchVisible).toBeTrue();
      expect(HomePage.prototype.showSearch).toHaveBeenCalled();

      component.toggleSearch();
      expect(component.isSearchVisible).toBeFalse();
      expect(HomePage.prototype.hideSearch).toHaveBeenCalled();
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
      expect(indoorDirectionsServiceSpy.clearStartPoint).toHaveBeenCalled();
    });

    it('should clear the destination input when clearDestinationInput() is called', () => {
      component.destinationLocationInput = 'Some text';
      component.places = [{ title: 'Place2' }];
      spyOn(component, 'clearList');

      component.clearDestinationInput();

      expect(component.destinationLocationInput).toBe('');
      expect(component.clearList).toHaveBeenCalled();
      expect(directionsServiceSpy.clearDestinationPoint).toHaveBeenCalled();
      expect(indoorDirectionsServiceSpy.clearDestinationPoint).toHaveBeenCalled();
    });
  });

  describe('onSetUsersLocationAsStart()', () => {
    it('should retrieve current location and set start point via DirectionsService', fakeAsync(() => {
      currentLocationServiceSpy.getCurrentLocation.and.returnValue(
        Promise.resolve({ lat: 10, lng: 20 })
      );

      component.onSetUsersLocationAsStart();
      tick();

      expect(currentLocationServiceSpy.getCurrentLocation).toHaveBeenCalled();
      expect(directionsServiceSpy.setStartPoint).toHaveBeenCalledWith({
        title: 'Your Location',
        address: '10, 20',
        coordinates: jasmine.any(Object),
        type: 'outdoor'
      });
      expect(store.dispatch).toHaveBeenCalled();
    }));

    it('should throw an error if current location is null', async () => {
      currentLocationServiceSpy.getCurrentLocation.and.returnValue(Promise.resolve(null));
      spyOn(console, 'error');

      await expectAsync(component.onSetUsersLocationAsStart()).toBeRejectedWithError(
        'Current location is null.'
      );
    });
  });

  describe('Keyboard "enter" handling', () => {
    it('should set start point on enter if places is not empty', () => {
      const selectedPlace = {
        title: 'Start Place',
        address: 'Somewhere',
        coordinates: new google.maps.LatLng(10, 20),
        type: 'outdoor' as 'outdoor'
      };
      component.places = [selectedPlace];
      directionsServiceSpy.setStartPoint.calls.reset();

      // Simulate keyup.enter logic.
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

      // Simulate keyup.enter logic.
      directionsServiceSpy.setDestinationPoint(component.places[0]);
      component.clearList();

      expect(directionsServiceSpy.setDestinationPoint).toHaveBeenCalledWith(selectedPlace);
      expect(component.places.length).toBe(0);
    });
  });

  describe('ngOnInit and calculateShortestRoute', () => {
    let componentWithRoute: MapSearchComponent;
    let fixtureWithRoute: ComponentFixture<MapSearchComponent>;

    // Dummy google.maps.LatLng for testing.
    const dummyLatLng = {
      equals: (other: any) => true,
      lat: () => 10,
      lng: () => 20,
      toJSON: () => ({ lat: 10, lng: 20 }),
      toUrlValue: () => '10,20'
    } as google.maps.LatLng;

    beforeEach(() => {
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

      // Return a promise that resolves to a route object.
      directionsServiceSpy.calculateShortestRoute.and.returnValue(
        Promise.resolve({ eta: '10 mins', distance: 5, mode: 'WALKING' })
      );
      directionsServiceSpy.getShortestRoute.and.returnValue({
        eta: '10 mins',
        distance: 5,
        mode: 'WALKING'
      });

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
      directionsServiceSpy.calculateShortestRoute.and.returnValue(Promise.reject(error));
      const errorFixture = TestBed.createComponent(MapSearchComponent);
      const errorComponent = errorFixture.componentInstance;
      spyOn(console, 'error');
      errorFixture.detectChanges();
      tick();
      flushMicrotasks();
      expect(console.error).toHaveBeenCalledWith('Error calculating route:', error);
      expect(errorComponent.currentRouteData).toBeNull();
    }));

    it('should not call calculateShortestRoute if one of the points is null', fakeAsync(() => {
      directionsServiceSpy.calculateShortestRoute.calls.reset();
      directionsServiceSpy.getStartPoint.and.returnValue(of(null));
      directionsServiceSpy.getDestinationPoint.and.returnValue(
        of({
          title: 'Destination Only',
          address: 'destination only address',
          coordinates: dummyLatLng,
          type: 'outdoor'
        })
      );
      const incompleteFixture = TestBed.createComponent(MapSearchComponent);
      const incompleteComponent = incompleteFixture.componentInstance;
      incompleteFixture.detectChanges();
      tick();
      flushMicrotasks();
      expect(directionsServiceSpy.calculateShortestRoute).not.toHaveBeenCalled();
      expect(incompleteComponent.destinationLocationInput).toBe('Destination Only');
    }));
  });

  describe('onStartClick()', () => {
    it('should toggle components, and toggle search', () => {
      // Access private members via type assertions.
      const visibilityService = (component as any).visibilityService;
      const directionsService = (component as any).directionsService;

      if (!directionsService.showDirections) {
        directionsService.showDirections = () => {};
      }

      spyOn(component, 'toggleSearch').and.callThrough();

      component.isSearchVisible = false;
      component.onStartClick();

      expect(visibilityService.toggleDirectionsComponent).toHaveBeenCalled();
      expect(visibilityService.togglePOIsComponent).toHaveBeenCalled();
      expect(component.toggleSearch).toHaveBeenCalled();
      expect(component.isSearchVisible).toBeTrue();
    });
  });

  it('should update startLocationInput and call indoorDirectionService.setStartPoint when indoorMapId is provided', async () => {
    const place = { title: 'Office', indoorMapId: 'indoor123', type: 'indoor' };
    // Simulate that the current map is different so that setMapData is called.
    mappedInServiceSpy.getMapId.and.returnValue('differentMap');
    await component.setStart(place);

    expect(component.startLocationInput).toBe('Office');
    expect(indoorDirectionsServiceSpy.setStartPoint).toHaveBeenCalledWith(place);
    expect(directionsServiceSpy.setStartPoint).not.toHaveBeenCalled();
    expect(mappedInServiceSpy.setMapData).toHaveBeenCalledWith('indoor123');
  });

  it('should update destinationLocationInput and call indoorDirectionService.setDestinationPoint when indoorMapId is provided', async () => {
    const place = { title: 'Mall', indoorMapId: 'indoor567', type: 'indoor' };
    mappedInServiceSpy.getMapId.and.returnValue('differentMap');
    await component.setDestination(place);

    expect(component.destinationLocationInput).toBe('Mall');
    expect(indoorDirectionsServiceSpy.setDestinationPoint).toHaveBeenCalledWith(place);
    expect(directionsServiceSpy.setDestinationPoint).not.toHaveBeenCalled();
    expect(mappedInServiceSpy.setMapData).toHaveBeenCalledWith('indoor567');
  });
});
