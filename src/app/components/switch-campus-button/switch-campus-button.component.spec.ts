import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchCampusButtonComponent } from './switch-campus-button.component';
import { GoogleMapService } from 'src/app/services/googeMap.service';

class MockGoogleMapService {
  updateMapLocation = jasmine.createSpy('updateMapLocation');
}

describe('SwitchCampusButtonComponent', () => {
  let component: SwitchCampusButtonComponent;
  let fixture: ComponentFixture<SwitchCampusButtonComponent>;
  let googleMapService: MockGoogleMapService;

  beforeAll(() => {
    // Mock Google Maps API globally
    (window as any).google = {
      maps: {
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SwitchCampusButtonComponent],
      providers: [
        { provide: GoogleMapService, useClass: MockGoogleMapService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchCampusButtonComponent);
    component = fixture.componentInstance;
    googleMapService = TestBed.inject(GoogleMapService) as any;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should switch campus from SGW to LOY and call updateMapLocation with LOY coordinates', () => {
    component.switchCampus();
    expect(component.selectedCampus).toBe('LOY');
    expect(googleMapService.updateMapLocation).toHaveBeenCalledWith(
      new google.maps.LatLng(
        component.loyLocation.lat,
        component.loyLocation.lng
      )
    );
  });

  it('should switch campus from LOY to SGW and call updateMapLocation with SGW coordinates', () => {
    component.switchCampus();
    component.switchCampus();
    expect(component.selectedCampus).toBe('SGW');
    expect(googleMapService.updateMapLocation).toHaveBeenCalledWith(
      new google.maps.LatLng(
        component.sgwLocation.lat,
        component.sgwLocation.lng
      )
    );
  });
});
