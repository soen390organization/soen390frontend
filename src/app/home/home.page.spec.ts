import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';
import { Store } from '@ngrx/store';
import { of, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { MapType, selectCurrentMap } from 'src/app/store/app';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let storeSpy: jasmine.SpyObj<Store<any>>;
  let routerSpy: jasmine.SpyObj<Router>;
  let selectCurrentMapSubject: Subject<MapType>;

  beforeEach(async () => {
    // Create a subject for selectCurrentMap so we can push new values
    selectCurrentMapSubject = new Subject<MapType>();

    storeSpy = jasmine.createSpyObj('Store', ['select']);
    // When the store's select is called with selectCurrentMap, return our subject.
    storeSpy.select.and.callFake((selector: any) => {
      if (selector === selectCurrentMap) {
        return selectCurrentMapSubject.asObservable();
      }
      return of();
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [HomePage],
      providers: [
        { provide: Store, useValue: storeSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    // Trigger ngOnInit and constructor subscriptions.
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should subscribe to store and update currentMap', () => {
    // Emit a new value for current map
    selectCurrentMapSubject.next(MapType.Indoor);
    expect(component.currentMap).toEqual(MapType.Indoor);
  });

  it('openUserInfoPage should set loading to false and navigate to "profile"', () => {
    component.loading = true;
    component.openUserInfoPage();
    expect(component.loading).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['profile']);
  });

  it('onGoogleMapInitialized and onMappedinMapInitialized should update loading correctly', () => {
    // Reset loading to true for test
    component.loading = true;
    // Initially, both initialization flags are false.
    expect(component.googleMapInitialized).toBeFalse();
    expect(component.mappedinMapInitialized).toBeFalse();

    // Call onGoogleMapInitialized first.
    component.onGoogleMapInitialized();
    expect(component.googleMapInitialized).toBeTrue();
    // Since mappedinMapInitialized is still false, loading should remain true.
    expect(component.loading).toBeTrue();

    // Now call onMappedinMapInitialized.
    component.onMappedinMapInitialized();
    expect(component.mappedinMapInitialized).toBeTrue();
    // Now that both flags are true, checkInitialization should have set loading to false.
    expect(component.loading).toBeFalse();
  });

  describe('Search visibility', () => {
    it('showSearch should update isSearchVisible to true', () => {
      // Initially false
      component.isSearchVisible = false;
      component.showSearch();
      expect(component.isSearchVisible).toBeTrue();
    });

    it('hideSearch should update isSearchVisible to false', () => {
      // Initially set to true
      component.isSearchVisible = true;
      component.hideSearch();
      expect(component.isSearchVisible).toBeFalse();
    });
  });
});
