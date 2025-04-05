import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionBarComponent } from './interaction-bar.component';
import { ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { MapType, selectCurrentMap, selectSelectedCampus } from 'src/app/store/app';
import { PlacesService } from 'src/app/services/places/places.service';
// import { DirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { VisibilityService } from 'src/app/services/visibility.service';
// import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';

// Create a full spy for DirectionsService (as used in the DirectionsComponent tests) - Refactor Interface
const mockDirectionsService = jasmine.createSpyObj('DirectionsService', [
  'generateRoute',
  'calculateRoute',
  'getTravelMode',
  'getDestinationPoint',
  'getStartPoint',
  'setStartPoint',
  'setDestinationPoint',
  'calculateDistanceETA'
]);
mockDirectionsService.generateRoute.and.callFake((start, destination, mode) =>
  mockDirectionsService.calculateRoute(start, destination, mode)
);
mockDirectionsService.calculateRoute.and.returnValue(Promise.resolve({ steps: [], eta: null }));
mockDirectionsService.getTravelMode.and.returnValue('WALKING');
mockDirectionsService.hasBothPoints$ = of(true);
mockDirectionsService.getDestinationPoint.and.returnValue(
  of({ address: 'destination address', title: 'Destination', coordinates: {} })
);
mockDirectionsService.getStartPoint.and.returnValue(
  of({ address: 'start address', title: 'Start', coordinates: {} })
);
mockDirectionsService.setStartPoint.and.stub();
mockDirectionsService.setDestinationPoint.and.stub();
mockDirectionsService.calculateDistanceETA.and.returnValue(
  Promise.resolve({ eta: 'default ETA', totalDistance: 0 })
);

// Dummy implementation for PlacesService
const mockPlacesService = {
  isInitialized: () => of(true),
  getCampusBuildings: () => of([]),
  getPointsOfInterest: () => of([])
};

// Create a spy for Store
const mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
mockStore.select.and.callFake((selector: any) => {
  if (selector === selectCurrentMap) {
    return of(MapType.Outdoor);
  }
  if (selector === selectSelectedCampus) {
    return of('someCampus');
  }
  return of();
});

// Provide a dummy for VisibilityService with the needed observables
const mockVisibilityService = {
  showDirections: of(true),
  showPOIs: of(true),
  endNavigation: of(null),
  toggleDirectionsComponent: jasmine.createSpy('toggleDirectionsComponent'),
  togglePOIsComponent: jasmine.createSpy('togglePOIsComponent'),
  toggleStartButton: jasmine.createSpy('toggleStartButton')
};

// For NavigationCoordinatorService, we provide a dummy with globalRoute$
// const mockNavigationCoordinatorService = { globalRoute$: of({ segments: [] }) };

describe('InteractionBarComponent', () => {
  let component: InteractionBarComponent;
  let fixture: ComponentFixture<InteractionBarComponent>;
  let mockStoreRef: jasmine.SpyObj<Store<any>>;

  beforeEach(async () => {
    // Create a spy for Store if not already done (we already created mockStore above)
    mockStoreRef = mockStore;

    await TestBed.configureTestingModule({
      imports: [InteractionBarComponent],
      providers: [
        { provide: Store, useValue: mockStoreRef },
        { provide: PlacesService, useValue: mockPlacesService },
        // { provide: DirectionsService, useValue: mockDirectionsService },
        { provide: VisibilityService, useValue: mockVisibilityService }
        // { provide: NavigationCoordinatorService, useValue: mockNavigationCoordinatorService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionBarComponent);
    component = fixture.componentInstance;
    // Manually assign footerContainer and handleBar so that their nativeElement is defined.
    component.footerContainer = new ElementRef(document.createElement('div'));
    component.handleBar = new ElementRef(document.createElement('div'));
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should initialize as collapsed', () => {
    expect(component.isExpanded).toBe(false);
  });

  it('should move footer on touchmove', () => {
    component.isDragging = true;
    component.startY = 300;
    const fakeEvent = {
      preventDefault: jasmine.createSpy('preventDefault')
    } as any;

    component.onDragMove(250, fakeEvent);

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    // Check that the style transform was updated to include "translateY"
    expect(component.footerContainer.nativeElement.style.transform).toContain('translateY');
  });

  it('should expand on swipe up', () => {
    component.isDragging = true;
    component.startY = 300;
    component.currentY = 200;

    component.onDragEnd();
    expect(component.isExpanded).toBe(true);
  });

  it('should collapse on swipe down', () => {
    component.isDragging = true;
    component.startY = 200;
    component.currentY = 300;
    component.isExpanded = true;

    component.onDragEnd();
    expect(component.isExpanded).toBe(false);
  });

  it('should prevent scrolling while swiping', () => {
    const fakeEvent = {
      preventDefault: jasmine.createSpy('preventDefault')
    } as any;
    component.isDragging = true;
    component.onDragMove(250, fakeEvent);
    expect(fakeEvent.preventDefault).toHaveBeenCalled();
  });

  it('should stop dragging on touchend', () => {
    component.isDragging = true;
    component.onDragEnd();
    expect(component.isDragging).toBe(false);
  });

  it('should transition smoothly when expanded', () => {
    // Manually set a transition style on the footer container
    component.footerContainer.nativeElement.style.transition = 'transform 0.3s ease-out';
    component.isExpanded = true;
    component.onDragEnd();
    expect(component.footerContainer.nativeElement.style.transition).toContain(
      'transform 0.3s ease-out'
    );
  });

  it('should collapse the interaction bar when a location is selected', () => {
    component.isExpanded = true; // Start expanded

    // Call the method under test
    component.onLocationSelected();

    // Assertions
    expect(component.isExpanded).toBeFalse();
    expect(component.footerContainer.nativeElement.style.transform).toBe('translateY(80%)');
    expect(component.footerContainer.nativeElement.style.overflowY).toBe('');
    expect(component.swipeProgress).toBe(0);
  });
});
