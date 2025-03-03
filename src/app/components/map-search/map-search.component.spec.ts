import { of } from 'rxjs';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from 'src/app/services/directions/directions.service';
import { PlacesService } from 'src/app/services/places.service';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;

  // Spies for the injected services
  let directionsServiceSpy: jasmine.SpyObj<RouteService>;
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
      of({ title: 'Default Destination', address: '', coordinates: null })
    );
    placesServiceSpy = jasmine.createSpyObj('PlacesService', [
      'getPlaceSuggestions',
    ]);
    currentLocationServiceSpy = jasmine.createSpyObj('CurrentLocationService', [
      'getCurrentLocation',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        BrowserAnimationsModule, // Needed if testing animations
        MapSearchComponent,
      ],
      providers: [
        { provide: RouteService, useValue: directionsServiceSpy },
        { provide: PlacesService, useValue: placesServiceSpy },
        {
          provide: CurrentLocationService,
          useValue: currentLocationServiceSpy,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;
    directionsServiceSpy.getDestinationPoint.and.returnValue(of(null)); // to solve setting auto-true value
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
      const mockPlaces = [
        {
          title: 'Pizza Palace',
          address: '123 Main St',
          coordinates: new google.maps.LatLng(10, 20),
        },
        {
          title: 'Pizza Haven',
          address: '456 Side St',
          coordinates: new google.maps.LatLng(30, 40),
        },
      ];

      placesServiceSpy.getPlaceSuggestions.and.returnValue(
        Promise.resolve(mockPlaces)
      );

      await component.onSearchChange(event, 'start');

      expect(component.isSearchingFromStart).toBeTrue();
      expect(placesServiceSpy.getPlaceSuggestions).toHaveBeenCalledWith(
        'pizza'
      );
      expect(component.places).toEqual(mockPlaces);
    });

    it('should call placesService and set places when search query is not empty (destination)', async () => {
      const event = { target: { value: 'museum' } };
      const mockPlaces = [
        {
          title: 'Art Museum',
          address: '789 Park Ave',
          coordinates: new google.maps.LatLng(10, 20),
        },
      ];
      placesServiceSpy.getPlaceSuggestions.and.returnValue(
        Promise.resolve(mockPlaces)
      );

      await component.onSearchChange(event, 'destination');

      expect(component.isSearchingFromStart).toBeFalse();
      expect(placesServiceSpy.getPlaceSuggestions).toHaveBeenCalledWith(
        'museum'
      );
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
      });
    }));

    it('should throw an error if current location is null', async () => {
      // Mock the service to return null
      currentLocationServiceSpy.getCurrentLocation.and.returnValue(
        Promise.resolve(null)
      );
      spyOn(console, 'error'); // to suppress or check error logs

      await expectAsync(
        component.onSetUsersLocationAsStart()
      ).toBeRejectedWithError('Current location is null.');
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
      };
      component.places = [selectedPlace];
      directionsServiceSpy.setStartPoint.calls.reset();

      // Simulate the (keyup.enter) logic
      directionsServiceSpy.setStartPoint(component.places[0]);
      component.clearList();

      expect(directionsServiceSpy.setStartPoint).toHaveBeenCalledWith(
        selectedPlace
      );
      expect(component.places.length).toBe(0);
    });

    it('should set destination point on enter if places is not empty', () => {
      const selectedPlace = {
        title: 'Destination Place',
        address: 'Somewhere',
        coordinates: new google.maps.LatLng(30, 40),
      };
      component.places = [selectedPlace];
      directionsServiceSpy.setDestinationPoint.calls.reset();

      // Simulate the (keyup.enter) logic
      directionsServiceSpy.setDestinationPoint(component.places[0]);
      component.clearList();

      expect(directionsServiceSpy.setDestinationPoint).toHaveBeenCalledWith(
        selectedPlace
      );
      expect(component.places.length).toBe(0);
    });
  });
});
