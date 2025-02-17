import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SwitchCampusButtonComponent } from './switch-campus-button.component';
import { Store } from '@ngrx/store';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { setSelectedCampus } from 'src/app/store/app';
import { of } from 'rxjs';
import data from 'src/assets/ConcordiaData.json';

class MockGoogleMapService {
  updateMapLocation = jasmine.createSpy('updateMapLocation');
}

describe('SwitchCampusButtonComponent', () => {
  let component: SwitchCampusButtonComponent;
  let fixture: ComponentFixture<SwitchCampusButtonComponent>;
  let googleMapService: MockGoogleMapService;
  let store: jasmine.SpyObj<Store>;

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
    const mockStore = jasmine.createSpyObj<Store>('Store', ['select', 'dispatch']);
    mockStore.select.and.returnValue(of('sgw')); // Default return value for store.select

    TestBed.configureTestingModule({
      imports: [SwitchCampusButtonComponent],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: GoogleMapService, useClass: MockGoogleMapService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchCampusButtonComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    googleMapService = TestBed.inject(GoogleMapService) as any;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should switch campus from SGW to LOY and call updateMapLocation with LOY coordinates', () => {
    store.select.and.returnValue(of('sgw')); // Simulate current campus as 'sgw'
    component.switchCampus();

    expect(store.dispatch).toHaveBeenCalledWith(setSelectedCampus({ campus: 'loy' }));
    expect(googleMapService.updateMapLocation).toHaveBeenCalledWith(
      new google.maps.LatLng(
        data.loy.coordinates.lat,
        data.loy.coordinates.lng
      )
    );
  });
});
