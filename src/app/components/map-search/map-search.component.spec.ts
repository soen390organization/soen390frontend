import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';

class MockGoogleMapService {
  getMap = jasmine.createSpy('getMap').and.returnValue({});
  updateMapLocation = jasmine.createSpy('updateMapLocation');
}

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let googleMapService: MockGoogleMapService;
  let placesServiceMock: any;

  beforeAll(() => {
    // Mock Google Maps API
    (window as any).google = {
      maps: {
        places: {
          PlacesService: class {
            findPlaceFromQuery = jasmine.createSpy('findPlaceFromQuery');
          },
          PlacesServiceStatus: { OK: 'OK' },
        },
        Marker: class {
          setPosition = jasmine.createSpy('setPosition');
          setIcon = jasmine.createSpy('setIcon');
        },
        Size: class {
          constructor(public width: number, public height: number) {}
        },
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule, CommonModule, FormsModule, MapSearchComponent],
      providers: [
        { provide: GoogleMapService, useClass: MockGoogleMapService },
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;
    googleMapService = TestBed.inject(GoogleMapService) as any;
    fixture.detectChanges();

    placesServiceMock = new (window as any).google.maps.places.PlacesService();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle search visibility', () => {
    expect(component.isSearchVisible).toBeFalse();
    component.toggleSearch();
    expect(component.isSearchVisible).toBeTrue();
    component.toggleSearch();
    expect(component.isSearchVisible).toBeFalse();
  });

  it('should call onSearchChangeDestination and update map location', () => {
    const mockEvent = { detail: { value: 'Los Angeles' } };

    spyOn(component, 'onSearch');

    component.onSearchChangeDestination(mockEvent);

    expect(component.onSearch).toHaveBeenCalledWith(
      mockEvent,
      'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg'
    );
  });

  it('should correctly search a place and update the marker', () => {
    const mockEvent = { detail: { value: 'Loyola' } };
    const mockLocation = new google.maps.LatLng(34.0522, -118.2437);

    // Mock the PlacesService response
    placesServiceMock.findPlaceFromQuery.and.callFake(
      (request: any, callback: any) => {
        callback(
          [{ geometry: { location: mockLocation } }],
          google.maps.places.PlacesServiceStatus.OK
        );
      }
    );

    // Trigger the search
    component.onSearch(
      mockEvent,
      'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg'
    );

    // Verify the map location was updated
    expect(googleMapService.updateMapLocation).toHaveBeenCalledWith(
      mockLocation
    );

    // Verify the marker was updated
    expect(component.destinationMarker?.setPosition).toHaveBeenCalledWith(
      mockLocation
    );
    expect(component.destinationMarker?.setIcon).toHaveBeenCalled();
  });
});
