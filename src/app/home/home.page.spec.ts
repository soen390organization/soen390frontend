import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { HomePage } from './home.page';
import { MapSwitcherService, MapType } from 'src/app/services/mapSwitcher.service';

class MockMapSwitcherService {
  // A BehaviorSubject for the map type, default to Outdoor for test
  currentMap$ = new BehaviorSubject<MapType>(MapType.Outdoor);
}

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockService: MockMapSwitcherService;

  beforeEach(async () => {
    mockService = new MockMapSwitcherService();

    await TestBed.configureTestingModule({
      declarations: [HomePage],
      providers: [
        { provide: MapSwitcherService, useValue: mockService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe and set currentMap to the emitted value from currentMap$', () => {
    // Initially should be MapType.Outdoor
    expect(component.currentMap).toBe(MapType.Outdoor);

    // Emit a new value and verify
    mockService.currentMap$.next(MapType.Indoor);
    // Trigger change detection so bindings update
    fixture.detectChanges();

    expect(component.currentMap).toBe(MapType.Indoor);
  });

  it('should set googleMapInitialized to true when onGoogleMapInitialized is called', () => {
    // Initially false
    expect(component.googleMapInitialized).toBeFalse();
    component.onGoogleMapInitialized();
    expect(component.googleMapInitialized).toBeTrue();
  });

  it('should set mappedinMapInitialized to true when onMappedinMapInitialized is called', () => {
    // Initially false
    expect(component.mappedinMapInitialized).toBeFalse();
    component.onMappedinMapInitialized();
    expect(component.mappedinMapInitialized).toBeTrue();
  });

  it('should keep loading true if only one map is initialized', () => {
    // Start with both false
    expect(component.loading).toBeTrue();

    // Google map is initialized only
    component.onGoogleMapInitialized();
    expect(component.googleMapInitialized).toBeTrue();
    expect(component.mappedinMapInitialized).toBeFalse();
    // checkInitialization() should keep loading true
    expect(component.loading).toBeTrue();
  });

  it('should set loading to false once both maps are initialized', () => {
    // Initially loading = true
    expect(component.loading).toBeTrue();

    // Initialize Google first
    component.onGoogleMapInitialized();
    expect(component.loading).toBeTrue();  // Still true because mappedin not ready

    // Now initialize Mappedin
    component.onMappedinMapInitialized();
    // Once both flags are true, loading should become false
    expect(component.googleMapInitialized).toBeTrue();
    expect(component.mappedinMapInitialized).toBeTrue();
    expect(component.loading).toBeFalse();
  });
});
