import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';

// --- Google Maps Stub Setup ---
// Unconditionally override window.google so that our stub is used in tests.
declare var window: any;
window.google = {
  maps: {
    Marker: function (options: any) {
      (this as any).options = options;
      (this as any).getPosition = () => options.position;
      (this as any).setPosition = function (pos: any) {
        (this as any).options.position = pos;
      };
      (this as any).setIcon = function (icon: any) {
        (this as any).options.icon = icon;
      };
    },
    // Define Geocoder as a constructor and assign its instance method.
    Geocoder: function () {
      (this as any).geocode = function (request: any, callback: Function) {
        // Immediately call the callback with a fake geocode result.
        callback(
          [
            {
              formatted_address: 'Test Address',
              geometry: { location: { lat: () => 10, lng: () => 20 } },
            },
          ],
          'OK'
        );
      };
    },
    // Define places with a constructor for PlacesService.
    places: {
      PlacesServiceStatus: { OK: 'OK' },
      PlacesService: function (map: any) {
        (this as any).findPlaceFromQuery = function (request: any, callback: Function) {
          // Immediately call the callback with a fake place result.
          callback(
            [
              {
                geometry: { location: { lat: () => 10, lng: () => 20 } },
              },
            ],
            'OK'
          );
        };
      },
    },
    LatLngBounds: function () {
      (this as any).extend = jasmine.createSpy('extend');
    },
    Size: function (width: number, height: number) {
      return { width, height };
    },
  },
};

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;

  beforeEach(async () => {
    const googleMapSpy = jasmine.createSpyObj('GoogleMapService', [
      'getMap',
      'updateMapLocation',
    ]);

    await TestBed.configureTestingModule({
      imports: [IonicModule, CommonModule, FormsModule, MapSearchComponent],
      providers: [
        { provide: GoogleMapService, useValue: googleMapSpy },
        provideAnimations(),
      ],
    }).compileComponents();

    googleMapServiceSpy = TestBed.inject(GoogleMapService) as jasmine.SpyObj<GoogleMapService>;
    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;

    // Provide a fake map object for all tests.
    const fakeMap = jasmine.createSpyObj('Map', ['fitBounds', 'setCenter', 'setZoom']);
    googleMapServiceSpy.getMap.and.returnValue(fakeMap);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle search visibility', () => {
    expect(component.isSearchVisible).toBeFalse();
    component.toggleSearch();
    expect(component.isSearchVisible).toBeTrue();
    component.toggleSearch();
    expect(component.isSearchVisible).toBeFalse();
  });

  it('should not search if input is empty', () => {
    spyOn(component, 'onSearch');

    const emptyEvent = { target: { value: '' } };
    component.onSearchChangeStart(emptyEvent);
    expect(component.onSearch).not.toHaveBeenCalled();

    component.onSearchChangeDestination(emptyEvent);
    expect(component.onSearch).not.toHaveBeenCalled();
  });

  it('should call onSearch with correct icon for start location', () => {
    spyOn(component, 'onSearch');
    const event = { target: { value: 'New York' } };
    component.onSearchChangeStart(event);
    expect(component.onSearch).toHaveBeenCalledWith(
      jasmine.any(Object),
      'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg'
    );
  });

  it('should call onSearch with correct icon for destination', () => {
    spyOn(component, 'onSearch');
    const event = { target: { value: 'Los Angeles' } };
    component.onSearchChangeDestination(event);
    expect(component.onSearch).toHaveBeenCalledWith(
      jasmine.any(Object),
      'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg'
    );
  });

  // Tests for updateMapView()
  it('should update map view when both markers exist', () => {
    const fakeMap = googleMapServiceSpy.getMap();
    // Create fake markers with getPosition methods.
    component.startMarker = { getPosition: () => ({ lat: 10, lng: 20 }) } as any;
    component.destinationMarker = { getPosition: () => ({ lat: 30, lng: 40 }) } as any;
    component.updateMapView();
    expect(fakeMap.fitBounds).toHaveBeenCalled();
  });

  it('should update map view when only start marker exists', () => {
    const fakeMap = googleMapServiceSpy.getMap();
    component.startMarker = { getPosition: () => ({ lat: 10, lng: 20 }) } as any;
    component.destinationMarker = null;
    component.updateMapView();
    expect(fakeMap.setCenter).toHaveBeenCalledWith({ lat: 10, lng: 20 });
    expect(fakeMap.setZoom).toHaveBeenCalledWith(15);
  });

  it('should update map view when only destination marker exists', () => {
    const fakeMap = googleMapServiceSpy.getMap();
    component.startMarker = null;
    component.destinationMarker = { getPosition: () => ({ lat: 30, lng: 40 }) } as any;
    component.updateMapView();
    expect(fakeMap.setCenter).toHaveBeenCalledWith({ lat: 30, lng: 40 });
    expect(fakeMap.setZoom).toHaveBeenCalledWith(15);
  });

  // Test for onSetUsersLocationAsStart()
  it('should create start marker in onSetUsersLocationAsStart', fakeAsync(() => {
    // Spy on getCurrentLocation on the prototype of CurrentLocationService.
    spyOn(CurrentLocationService.prototype, 'getCurrentLocation').and.returnValue(Promise.resolve({ lat: 10, lng: 20 }));
    component.onSetUsersLocationAsStart();
    tick(); // flush the promise
    expect(component.startMarker).toBeDefined();
    expect(googleMapServiceSpy.updateMapLocation).toHaveBeenCalled();
  }));

  // Tests for onSearch()
  it('should update marker in onSearch when valid search term is provided (start marker)', fakeAsync(() => {
    const fakeEvent = { target: { value: 'New York' } };
    component.onSearch(fakeEvent, 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg');
    tick(); // flush asynchronous callback
    expect(googleMapServiceSpy.updateMapLocation).toHaveBeenCalled();
    expect(component.startMarker).toBeDefined();
  }));

  it('should update marker in onSearch when valid search term is provided (destination marker)', fakeAsync(() => {
    const fakeEvent = { target: { value: 'Los Angeles' } };
    component.onSearch(fakeEvent, 'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg');
    tick(); // flush asynchronous callback
    expect(googleMapServiceSpy.updateMapLocation).toHaveBeenCalled();
    expect(component.destinationMarker).toBeDefined();
  }));
});
