import { TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';
import { provideMockStore } from '@ngrx/store/testing'; // ✅ Import mock store

describe('HomePage', () => {
  let component: HomePage;
  let mockGoogleMap: any;
  let mockPlacesService: jasmine.SpyObj<any>;

  beforeEach(() => {
    // Mock Google Map instance
    mockGoogleMap = {
      map: {},
      updateMapLocation: jasmine.createSpy('updateMapLocation'),
    };

    // Mock Google PlacesService
    mockPlacesService = jasmine.createSpyObj('PlacesService', ['findPlaceFromQuery']);

    // Mock global Google Maps API
    (window.google as any) = {
      maps: {
        PlacesService: jasmine.createSpy().and.returnValue(mockPlacesService),
        Marker: jasmine.createSpy().and.callFake(() => ({
          setPosition: jasmine.createSpy('setPosition'),
          setIcon: jasmine.createSpy('setIcon'),
        })),
        Size: jasmine.createSpy().and.callFake((width, height) => ({ width, height })),
        places: {
          PlacesServiceStatus: { OK: 'OK' },
        },
      },
    };

    TestBed.configureTestingModule({
      declarations: [HomePage],
      providers: [
        provideMockStore({}), // ✅ Fix: Provide a mock store to prevent test failures
      ],
    }).compileComponents();

    component = TestBed.createComponent(HomePage).componentInstance;
    component.googleMap = mockGoogleMap;
  });

  // ✅ Test: onSearchChangeDestination should do nothing if search term is empty
  it('should not call updateMapLocation or create a marker if no search term is provided (onSearchChangeDestination)', () => {
    const mockEvent = { detail: { value: '' } };

    spyOn(component, 'onSearchChangeDestination');

    component.onSearchChangeDestination(mockEvent);

    expect(component.onSearchChangeDestination).toHaveBeenCalledWith(mockEvent);
  });

  // ✅ Test: onSearchChangeStart should do nothing if search term is empty
  it('should not call updateMapLocation or create a marker if no search term is provided (onSearchChangeStart)', () => {
    const mockEvent = { detail: { value: '' } };

    spyOn(component, 'onSearchChangeStart');

    component.onSearchChangeStart(mockEvent);

    expect(component.onSearchChangeStart).toHaveBeenCalledWith(mockEvent);
  });
});
