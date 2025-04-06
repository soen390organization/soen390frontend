import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { MappedinMapComponent } from './mappedin-map.component';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
// import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

class MockMappedinService {
  initialize = jasmine.createSpy('initialize').and.returnValue(Promise.resolve());
  getMapId = jasmine.createSpy('getMapId').and.returnValue('mockMapId');
}

class MockIndoorDirectionsService {
  getStartPoint = () => of(null);
  getDestinationPoint = () => of(null);
}

// class MockNavigationCoordinatorService {
//   getCompleteRoute = jasmine
//     .createSpy('getCompleteRoute')
//     .and.returnValue(Promise.resolve({ segments: [] }));
// }

// Create a dummy Store spy so that NavigationCoordinatorService can be constructed.
const mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
mockStore.select.and.returnValue(of(null));

describe('MappedinMapComponent', () => {
  let component: MappedinMapComponent;
  let fixture: ComponentFixture<MappedinMapComponent>;
  let mappedinService: MockMappedinService;
  let indoorDirectionsService: MockIndoorDirectionsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MappedinMapComponent, CommonModule],
      providers: [
        { provide: MappedinService, useClass: MockMappedinService },
        { provide: IndoorDirectionsService, useClass: MockIndoorDirectionsService },
        // { provide: NavigationCoordinatorService, useClass: MockNavigationCoordinatorService },
        { provide: Store, useValue: mockStore }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MappedinMapComponent);
    component = fixture.componentInstance;
    mappedinService = TestBed.inject(MappedinService) as unknown as MockMappedinService;
    indoorDirectionsService = TestBed.inject(
      IndoorDirectionsService
    ) as unknown as MockIndoorDirectionsService;
    fixture.detectChanges(); // triggers ngAfterViewInit asynchronously
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call initialize with the mappedinContainer element', fakeAsync(() => {
    // Allow the promise from initialize() to resolve.
    tick();
    expect(mappedinService.initialize).toHaveBeenCalled();

    const containerElement = fixture.nativeElement.querySelector('div');
    expect(mappedinService.initialize).toHaveBeenCalledWith(containerElement);
  }));

  it('should catch and log errors if initializing the map or computing route fails', fakeAsync(() => {
    const consoleErrorSpy = spyOn(console, 'error');

    // Simulate an error during initialization
    mappedinService.initialize.and.returnValue(Promise.reject('Initialization failed'));

    // Call ngAfterViewInit and expect error to be logged
    component.ngAfterViewInit();
    tick(); // Allow async operations to complete

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error initializing mappedin map or computing route:',
      'Initialization failed'
    );
  }));

  it('should call clearNavigation and renderNavigation when start or destination points are available', fakeAsync(() => {
    // Mock the observables to return values
    const mockStartPoint = { lat: 1, lng: 1 }; // Example start point
    const mockDestinationPoint = { lat: 2, lng: 2 }; // Example destination point
    const mockMapView = {}; // Simulate a valid map view

    spyOn(indoorDirectionsService, 'clearNavigation').and.returnValue(Promise.resolve());
    spyOn(indoorDirectionsService, 'renderNavigation').and.returnValue(Promise.resolve());

    indoorDirectionsService.getStartPoint$ = () => of(mockStartPoint);
    indoorDirectionsService.getDestinationPoint$ = () => of(mockDestinationPoint);
    mappedinService.getMapView = () => of(mockMapView);

    // Call ngAfterViewInit which triggers the combineLatest logic
    component.ngAfterViewInit();
    tick(); // Allow async operations to complete

    // Ensure that clearNavigation and renderNavigation were called
    expect(indoorDirectionsService.clearNavigation).toHaveBeenCalled();
    expect(indoorDirectionsService.renderNavigation).toHaveBeenCalled();
  }));

  it('should not call renderNavigation if start and destination points are not available', fakeAsync(() => {
    // Mock the observables to return null
    const mockMapView = {}; // Simulate a valid map view

    spyOn(indoorDirectionsService, 'clearNavigation').and.returnValue(Promise.resolve());
    spyOn(indoorDirectionsService, 'renderNavigation').and.returnValue(Promise.resolve());

    indoorDirectionsService.getStartPoint$ = () => of(null);
    indoorDirectionsService.getDestinationPoint$ = () => of(null);
    mappedinService.getMapView = () => of(mockMapView);

    // Call ngAfterViewInit which triggers the combineLatest logic
    component.ngAfterViewInit();
    tick(); // Allow async operations to complete

    // Ensure that clearNavigation was called, but renderNavigation was not
    expect(indoorDirectionsService.clearNavigation).toHaveBeenCalled();
    expect(indoorDirectionsService.renderNavigation).not.toHaveBeenCalled();
  }));
});
