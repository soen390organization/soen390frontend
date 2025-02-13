import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';

// Mock Google Maps API
// ✅ Updated MockGoogleMapService with getMap()
class MockGoogleMapService {
  updateMapLocation = jasmine.createSpy('updateMapLocation');
  getMap = jasmine.createSpy('getMap').and.returnValue({
    fitBounds: jasmine.createSpy('fitBounds'),
    setCenter: jasmine.createSpy('setCenter'),
    setZoom: jasmine.createSpy('setZoom'),
  });
}

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let googleMapService: MockGoogleMapService;

  beforeAll(() => {
    (window as any).google = {
      maps: {
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
        Marker: class {
          position: any;
          constructor(options: any) {
            this.position = options.position;
          }
          getPosition() {
            return this.position;
          }
          setPosition(pos: any) {
            this.position = pos;
          }
        },
        Geocoder: class {
          geocode(request: any, callback: Function) {
            callback(
              [
                {
                  formatted_address: 'Test Address',
                  geometry: { location: { lat: () => 10, lng: () => 20 } },
                },
              ],
              'OK'
            );
          }
        },
        LatLngBounds: class {
          extend = jasmine.createSpy('extend');
          getCenter() {
            return { lat: 10, lng: 20 };
          }
        },
        Size: class {
          width: number;
          height: number;
          constructor(width: number, height: number) {
            this.width = width;
            this.height = height;
          }
        },
        places: {
          PlacesServiceStatus: { OK: 'OK' },
          PlacesService: class {
            findPlaceFromQuery(request: any, callback: Function) {
              callback(
                [
                  {
                    geometry: { location: { lat: () => 10, lng: () => 20 } },
                  },
                ],
                'OK'
              );
            }
          },
        },
      },
    };
  });
  

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule, CommonModule, FormsModule], // FIX: Removed MapSearchComponent from imports
      declarations: [MapSearchComponent], // FIX: MapSearchComponent should be declared here
      providers: [
        { provide: GoogleMapService, useClass: MockGoogleMapService },
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;
    googleMapService = TestBed.inject(GoogleMapService) as any;

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

  it('should not search if input is empty', fakeAsync(() => {
    spyOn(component, 'onSearchChangeStart');
    spyOn(component, 'onSearchChangeDestination');

    const emptyEvent = { target: { value: '' } };
    component.onSearchChangeStart(emptyEvent);
    component.onSearchChangeDestination(emptyEvent);

    tick();
    expect(component.onSearchChangeStart).not.toHaveBeenCalled();
    expect(component.onSearchChangeDestination).not.toHaveBeenCalled();
  }));

  it('should call onSearchChangeStart with correct icon for start location', fakeAsync(() => {
    const event = { target: { value: 'New York' } };
    spyOn(component, 'onSearchChangeStart').and.callThrough();
    component.onSearchChangeStart(event);

    tick();
    expect(component.onSearchChangeStart).toHaveBeenCalledWith(event);
    // Ensure correct marker icon is passed
    expect(component.startLocation?.marker.getIcon()).toEqual('https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg');
  }));

  it('should call onSearchChangeDestination with correct icon for destination', fakeAsync(() => {
    const event = { target: { value: 'Los Angeles' } };
    spyOn(component, 'onSearchChangeDestination').and.callThrough();
    component.onSearchChangeDestination(event);

    tick();
    expect(component.onSearchChangeDestination).toHaveBeenCalledWith(event);
    // Ensure correct marker icon is passed
    expect(component.destinationLocation?.marker.getIcon()).toEqual('https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg');
  }));

  it('should create start marker in onSetUsersLocationAsStart', fakeAsync(() => {
    spyOn(CurrentLocationService.prototype, 'getCurrentLocation').and.returnValue(
      Promise.resolve({ lat: 10, lng: 20 })
    );
    component.onSetUsersLocationAsStart();
    tick();
    expect(component.startLocation?.marker).toBeDefined();
    expect(googleMapService.getMap).toHaveBeenCalled();
  }));

  it('should update marker in onSearchChangeStart when valid search term is provided', fakeAsync(() => {
    const fakeEvent = { target: { value: 'New York' } };
    spyOn(component, 'findPlace').and.returnValue(Promise.resolve({ formatted_address: 'New York', geometry: { location: { lat: () => 10, lng: () => 20 } } }));
    component.onSearchChangeStart(fakeEvent);
    
    tick();
    expect(googleMapService.getMap).toHaveBeenCalled();
    expect(component.startLocation?.marker).toBeDefined();
  }));

  it('should update marker in onSearchChangeDestination when valid search term is provided', fakeAsync(() => {
    const fakeEvent = { target: { value: 'Los Angeles' } };
    spyOn(component, 'findPlace').and.returnValue(Promise.resolve({ formatted_address: 'Los Angeles', geometry: { location: { lat: () => 10, lng: () => 20 } } }));
    component.onSearchChangeDestination(fakeEvent);

    tick();
    expect(googleMapService.getMap).toHaveBeenCalled();
    expect(component.destinationLocation?.marker).toBeDefined();
  }));
});
