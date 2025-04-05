import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { PlacesService } from 'src/app/services/places/places.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { MapType, setMapType, setShowRoute } from 'src/app/store/app';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let store: MockStore;

  const mockOutdoorService = jasmine.createSpyObj('OutdoorDirectionsService', [
    'getStartPoint$', 'getDestinationPoint$', 'showStartMarker', 'showDestinationMarker',
    'getShortestRoute', 'setSelectedStrategy', 'clearStartMarker', 'clearDestinationMarker',
    'renderNavigation', 'clearNavigation', 'clearStartPoint', 'clearDestinationPoint',
    'setStartPoint', 'setDestinationPoint', 'getSelectedStrategy$'
  ]);

  const mockIndoorService = jasmine.createSpyObj('IndoorDirectionsService', [
    'getStartPoint$', 'getDestinationPoint$', 'clearStartPoint', 'clearDestinationPoint', 'clearNavigation',
    'setStartPoint', 'setDestinationPoint'
  ]);

  const mockMappedinService = jasmine.createSpyObj('MappedinService', ['getMapId', 'setMapData']);
  const mockGoogleMapService = jasmine.createSpyObj('GoogleMapService', ['updateMapLocation', 'getMap']);
  const mockPlacesService = jasmine.createSpyObj('PlacesService', ['getPlaceSuggestions']);
  const mockLocationService = jasmine.createSpyObj('CurrentLocationService', ['getCurrentLocation']);

  const initialState = { app: { showRoute: false } };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSearchComponent, IonicModule],
      providers: [
        provideAnimations(),
        provideMockStore({ initialState }),
        { provide: OutdoorDirectionsService, useValue: mockOutdoorService },
        { provide: IndoorDirectionsService, useValue: mockIndoorService },
        { provide: MappedinService, useValue: mockMappedinService },
        { provide: GoogleMapService, useValue: mockGoogleMapService },
        { provide: PlacesService, useValue: mockPlacesService },
        { provide: CurrentLocationService, useValue: mockLocationService }
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle search visibility', () => {
    component.isSearchVisible = false;
    component.toggleSearch();
    expect(component.isSearchVisible).toBeTrue();
  });

  it('should clear place list', () => {
    component.places = [{}, {}];
    component.clearList();
    expect(component.places).toEqual([]);
  });

  it('should clear start input', () => {
    component.startLocationInput = 'test';
    component.clearStartInput();
    expect(component.startLocationInput).toBe('');
    expect(mockOutdoorService.clearStartMarker).toHaveBeenCalled();
    expect(mockOutdoorService.clearStartPoint).toHaveBeenCalled();
    expect(mockIndoorService.clearStartPoint).toHaveBeenCalled();
  });

  it('should clear destination input', () => {
    component.destinationLocationInput = 'test';
    component.clearDestinationInput();
    expect(component.destinationLocationInput).toBe('');
    expect(mockOutdoorService.clearDestinationMarker).toHaveBeenCalled();
    expect(mockOutdoorService.clearDestinationPoint).toHaveBeenCalled();
    expect(mockIndoorService.clearDestinationPoint).toHaveBeenCalled();
  });

  it('should clear location', () => {
    component.places = [{}, {}];
    component.clearLocation();
    expect(component.places).toEqual([]);
    expect(mockOutdoorService.clearNavigation).toHaveBeenCalled();
    expect(mockOutdoorService.setSelectedStrategy).toHaveBeenCalledWith(null);
    expect(mockIndoorService.clearNavigation).toHaveBeenCalled();
  });

  it('should dispatch show route on start click', () => {
    spyOn(store, 'dispatch');
    component.isSearchVisible = true;
    component.onStartClick();
    expect(store.dispatch).toHaveBeenCalledWith(setShowRoute({ show: true }));
    expect(component.isSearchVisible).toBeFalse();
  });

  it('should handle search change with empty input', fakeAsync(() => {
    component.onSearchChange({ target: { value: '' } }, 'start');
    tick();
    expect(component.places).toEqual([]);
  }));

  it('should fetch place suggestions on search change', fakeAsync(() => {
    mockPlacesService.getPlaceSuggestions.and.resolveTo([{ title: 'Place A' }]);
    component.onSearchChange({ target: { value: 'Library' } }, 'destination');
    tick();
    expect(component.isSearchingFromStart).toBeFalse();
    expect(component.places).toEqual([{ title: 'Place A' }]);
  }));

  it('should set user location as start point', fakeAsync(async () => {
    spyOn(store, 'dispatch');
    const position = { lat: 45, lng: -73 };
    mockLocationService.getCurrentLocation.and.resolveTo(position);
    await component.onSetUsersLocationAsStart();
    expect(mockLocationService.getCurrentLocation).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
  }));

  it('should throw error if user location is null', async () => {
    mockLocationService.getCurrentLocation.and.resolveTo(null);
    await expectAsync(component.onSetUsersLocationAsStart()).toBeRejectedWithError('Current location is null.');
  });

  it('should set indoor start location', fakeAsync(async () => {
    spyOn(store, 'dispatch');
    mockMappedinService.getMapId.and.returnValue('abc');
    const place = {
      title: 'Test',
      fullName: 'Full Test',
      address: '123',
      coordinates: {},
      type: 'indoor',
      indoorMapId: 'def'
    };
    await component.setStart(place);
    expect(mockIndoorService.setStartPoint).toHaveBeenCalledWith(place);
    expect(mockOutdoorService.setStartPoint).toHaveBeenCalled();
    expect(mockMappedinService.setMapData).toHaveBeenCalledWith('def');
    expect(store.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Indoor }));
    expect(component.places.length).toBe(0);
  }));

  it('should set outdoor start location', fakeAsync(async () => {
    spyOn(store, 'dispatch');
    const place = { title: 'Out', address: '123', coordinates: {}, type: 'outdoor' };
    await component.setStart(place);
    expect(mockOutdoorService.setStartPoint).toHaveBeenCalledWith(place);
    expect(store.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
  }));

  it('should set indoor destination', fakeAsync(async () => {
    spyOn(store, 'dispatch');
    mockMappedinService.getMapId.and.returnValue('old');
    const place = {
      title: 'Dest',
      fullName: 'Full Dest',
      address: '321',
      coordinates: {},
      type: 'indoor',
      indoorMapId: 'new'
    };
    await component.setDestination(place);
    expect(mockIndoorService.setDestinationPoint).toHaveBeenCalledWith(place);
    expect(mockOutdoorService.setDestinationPoint).toHaveBeenCalled();
    expect(mockMappedinService.setMapData).toHaveBeenCalledWith('new');
    expect(store.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Indoor }));
  }));

  it('should set outdoor destination', fakeAsync(async () => {
    spyOn(store, 'dispatch');
    const place = { title: 'OutDest', address: '456', coordinates: {}, type: 'outdoor' };
    await component.setDestination(place);
    expect(mockOutdoorService.setDestinationPoint).toHaveBeenCalledWith(place);
    expect(store.dispatch).toHaveBeenCalledWith(setMapType({ mapType: MapType.Outdoor }));
  }));

  it('should run ngOnInit logic', fakeAsync(() => {
    mockOutdoorService.getStartPoint$.and.returnValue(of(null));
    mockOutdoorService.getDestinationPoint$.and.returnValue(of(null));
    mockIndoorService.getStartPoint$.and.returnValue(of(null));
    mockIndoorService.getDestinationPoint$.and.returnValue(of(null));
    store.setState({ app: { showRoute: true } });

    fixture.detectChanges();
    tick();
    expect(component.disableStart).toBeTrue();
  }));

  describe('setUserLocationAsDefaultStart', () => {
    it('should set user location as start and update map location if position is available', fakeAsync(() => {
      // Arrange: simulate a valid position and spy on the setStart method
      const mockPosition = { lat: 45, lng: -73 };
      mockLocationService.getCurrentLocation.and.resolveTo(mockPosition);
      spyOn(component, 'setStart');
  
      // Act: call the private method using a type cast
      (component as any).setUserLocationAsDefaultStart();
      tick(); // flush pending microtasks
  
      // Assert: verify setStart is called with the expected place object
      expect(component.setStart).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Your Location',
        address: '45, -73',
        type: 'outdoor'
      }));
      // Assert: verify updateMapLocation is called (receiving a google.maps.LatLng instance)
      expect(mockGoogleMapService.updateMapLocation).toHaveBeenCalled();
    }));
  
    it('should not set start or update map location if getCurrentLocation returns null', fakeAsync(() => {
      // Arrange: simulate a null response for current location
      mockLocationService.getCurrentLocation.and.resolveTo(null);
      spyOn(component, 'setStart');
  
      // Act: call the private method
      (component as any).setUserLocationAsDefaultStart();
      tick();
  
      // Assert: ensure neither setStart nor updateMapLocation is called
      expect(component.setStart).not.toHaveBeenCalled();
      expect(mockGoogleMapService.updateMapLocation).not.toHaveBeenCalled();
    }));
  
    it('should catch error and log warning when getCurrentLocation throws an error', fakeAsync(() => {
      // Arrange: force getCurrentLocation to reject with an error
      const errorMessage = 'Some error';
      mockLocationService.getCurrentLocation.and.rejectWith(errorMessage);
      spyOn(console, 'warn');
  
      // Act: call the private method
      (component as any).setUserLocationAsDefaultStart();
      tick();
  
      // Assert: verify that console.warn is called with the error message
      expect(console.warn).toHaveBeenCalledWith('Could not fetch user location on init:', errorMessage);
    }));
  });
  
  it('should return the correct icon for highlighted places', () => {
    const highlightedPlaceTitle = 'H Building Concordia University';
    const defaultIcon = 'location_on';
  
    // Test when the place is in the highlightedPlaces map
    const icon = component.getPlaceIcon(highlightedPlaceTitle);
    expect(icon).toBe('location_city');
  
    // Test when the place is not in the highlightedPlaces map
    const nonHighlightedPlaceTitle = 'Nonexistent Place';
    const nonHighlightedIcon = component.getPlaceIcon(nonHighlightedPlaceTitle);
    expect(nonHighlightedIcon).toBe(defaultIcon);
  });
  
  it('should return the default icon if title is undefined or empty', () => {
    const undefinedIcon = component.getPlaceIcon(undefined);
    expect(undefinedIcon).toBe('location_on');
    
    const emptyIcon = component.getPlaceIcon('');
    expect(emptyIcon).toBe('location_on');
  });
  
});
