import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MapType } from 'src/app/store/app';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let store: MockStore;
  const initialState = {
    app: {
      selectedCampus: 'sgw',
      currentMap: MapType.Outdoor,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store.setState(initialState);
    store.resetSelectors();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Store-related tests', () => {
    it('should subscribe and set currentMap to the emitted value from the store', () => {
      expect(component.currentMap).toBe(MapType.Outdoor);

      store.setState({
        app: {
          selectedCampus: 'sgw',
          currentMap: MapType.Indoor,
        },
      });
      fixture.detectChanges();

      expect(component.currentMap).toBe(MapType.Indoor);
    });

    it('should set googleMapInitialized to true when onGoogleMapInitialized is called', () => {
      expect(component.googleMapInitialized).toBeFalse();
      component.onGoogleMapInitialized();
      expect(component.googleMapInitialized).toBeTrue();
    });

    it('should set mappedinMapInitialized to true when onMappedinMapInitialized is called', () => {
      expect(component.mappedinMapInitialized).toBeFalse();
      component.onMappedinMapInitialized();
      expect(component.mappedinMapInitialized).toBeTrue();
    });

    it('should keep loading true if only one map is initialized', () => {
      expect(component.loading).toBeTrue();
      component.onGoogleMapInitialized();
      expect(component.googleMapInitialized).toBeTrue();
      expect(component.mappedinMapInitialized).toBeFalse();
      expect(component.loading).toBeTrue();
    });

    it('should set loading to false once both maps are initialized', () => {
      expect(component.loading).toBeTrue();
      component.onGoogleMapInitialized();
      expect(component.loading).toBeTrue();
      component.onMappedinMapInitialized();
      expect(component.googleMapInitialized).toBeTrue();
      expect(component.mappedinMapInitialized).toBeTrue();
      expect(component.loading).toBeFalse();
    });
  });

  describe('Search state tests', () => {
    it('should toggle search visibility', () => {
      // Initially false
      expect(component.isSearchVisible).toBeFalse();

      component.showSearch();
      expect(component.isSearchVisible).toBeTrue();

      component.hideSearch();
      expect(component.isSearchVisible).toBeFalse();
    });
  });
});
