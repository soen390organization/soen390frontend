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
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let store: MockStore;

  const mockOutdoorService = jasmine.createSpyObj('OutdoorDirectionsService', [
    'getStartPoint$',
    'getDestinationPoint$',
    'showStartMarker',
    'showDestinationMarker',
    'getShortestRoute',
    'setSelectedStrategy',
    'clearStartMarker',
    'clearDestinationMarker',
    'renderNavigation',
    'clearNavigation',
    'clearStartPoint',
    'clearDestinationPoint',
    'setStartPoint',
    'setDestinationPoint'
  ]);

  const mockIndoorService = jasmine.createSpyObj('IndoorDirectionsService', [
    'getStartPoint$',
    'getDestinationPoint$',
    'clearStartPoint',
    'clearDestinationPoint',
    'clearNavigation',
    'setStartPoint',
    'setDestinationPoint',
    'setSelectedStrategy',
    'renderNavigation',
    'getInitializedRoutes'
  ]);

  const mockMappedinService = jasmine.createSpyObj('MappedinService', ['getMapId', 'setMapData']);
  const mockGoogleMapService = jasmine.createSpyObj('GoogleMapService', [
    'updateMapLocation',
    'getMap'
  ]);
  const mockPlacesService = jasmine.createSpyObj('PlacesService', ['getPlaceSuggestions']);
  const mockLocationService = jasmine.createSpyObj('CurrentLocationService', [
    'getCurrentLocation'
  ]);
  const mockConcordiaDataService = jasmine.createSpyObj('ConcordiaDataService', [
    'getHighlightedBuildings'
  ]);

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
        { provide: CurrentLocationService, useValue: mockLocationService },
        { provide: ConcordiaDataService, useValue: mockConcordiaDataService }
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;

    // Default highlight set for getPlaceIcon / isHighlighted
    mockConcordiaDataService.getHighlightedBuildings.and.returnValue(
      new Set(['H Building Concordia University'])
    );
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

  it('should handle search change with empty input', fakeAsync(() => {
    component.onSearchChange({ target: { value: '' } }, 'start');
    tick();
    expect(component.places).toEqual([]);
  }));

  it('should fetch place suggestions on search change', fakeAsync(() => {
    mockPlacesService.getPlaceSuggestions.and.resolveTo([{ title: 'Place A' }]);
    component.onSearchChange({ target: { value: 'Library' } }, 'destination');
    tick();
    expect(component.places).toEqual([{ title: 'Place A' }]);
  }));

  it('should call setUserLocation if place isYourLocation (start)', fakeAsync(async () => {
    spyOn(component, 'setUserLocation').and.callThrough();
    const place = {
      isYourLocation: true,
      title: 'Your Location',
      address: 'Use your current location',
      type: 'outdoor'
    };
    mockLocationService.getCurrentLocation.and.resolveTo({ lat: 45, lng: -73 });

    await component.setStart(place);
    expect(component.setUserLocation).toHaveBeenCalledWith('start');
  }));

  it('should call setUserLocation if place isYourLocation (destination)', fakeAsync(async () => {
    spyOn(component, 'setUserLocation').and.callThrough();
    const place = {
      isYourLocation: true,
      title: 'Your Location',
      address: 'Use your current location',
      type: 'outdoor'
    };
    mockLocationService.getCurrentLocation.and.resolveTo({ lat: 45, lng: -73 });

    await component.setDestination(place);
    expect(component.setUserLocation).toHaveBeenCalledWith('destination');
  }));

  it('should return the correct icon for highlighted and default places', () => {
    expect(component.getPlaceIcon('H Building Concordia University')).toBe('location_city');
    expect(component.getPlaceIcon('Random')).toBe('location_on');
    expect(component.getPlaceIcon(undefined)).toBe('location_on');
  });
});
