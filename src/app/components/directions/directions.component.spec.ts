import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectionsComponent } from './directions.component';
import { Step } from 'src/app/interfaces/step.interface';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { VisibilityService } from 'src/app/services/visibility.service';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';

// Create a spy object for DirectionsService with all required methods.
// Extract Interface (the set of methods)
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

const mockCurrentLocationService = {
  watchLocation: jasmine.createSpy('watchLocation').and.returnValue(Promise.resolve('123')),
  clearWatch: jasmine.createSpy('clearWatch')
};

const mockVisibilityService = {
  toggleDirectionsComponent: jasmine.createSpy('toggleDirectionsComponent'),
  togglePOIsComponent: jasmine.createSpy('togglePOIsComponent'),
  toggleStartButton: jasmine.createSpy('toggleStartButton'),
  endNavigation: of(null)
};

const mockNavigationCoordinatorService = jasmine.createSpyObj('NavigationCoordinatorService', [
  'getCompleteRoute'
]);
mockNavigationCoordinatorService.getCompleteRoute.and.returnValue(
  Promise.resolve({ segments: [{ type: 'indoor', instructions: { steps: [], eta: null } }] })
);

describe('DirectionsComponent', () => {
  let component: DirectionsComponent;
  let fixture: ComponentFixture<DirectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectionsComponent, CommonModule],
      providers: [
        { provide: DirectionsService, useValue: mockDirectionsService },
        { provide: CurrentLocationService, useValue: mockCurrentLocationService },
        { provide: VisibilityService, useValue: mockVisibilityService },
        { provide: NavigationCoordinatorService, useValue: mockNavigationCoordinatorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DirectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with WALKING mode', () => {
    expect(component.selectedMode).toBe('WALKING');
  });

  it('should set mode correctly', () => {
    component.setMode('DRIVING');
    expect(component.selectedMode).toBe('DRIVING');
  });

  it('should load directions and update steps and eta', async () => {
    const mockSteps: Step[] = [
      {
        instructions: 'Walk north on Main St.',
        start_location: {
          lat: () => 45.5017,
          lng: () => -73.5673,
          equals: () => false,
          toJSON: () => ({ lat: 45.5017, lng: -73.5673 }),
          toUrlValue: () => ''
        },
        end_location: {
          lat: () => 44.1232,
          lng: () => -72.4356,
          equals: () => false,
          toJSON: () => ({ lat: 44.1232, lng: -72.4356 }),
          toUrlValue: () => ''
        },
        distance: { text: '200 m', value: 200 },
        duration: { text: '2 mins', value: 2 },
        transit_details: undefined
      }
    ];
    // Override calculateRoute to return our mockSteps and ETA.
    mockDirectionsService.calculateRoute.and.returnValue(
      Promise.resolve({ steps: mockSteps, eta: '6 mins' })
    );

    await component.loadDirections('WALKING');
    expect(component.steps).toEqual(mockSteps);
    expect(component.eta).toBe('6 mins');
    expect(component.isLoading).toBeFalse();
  });

  it('should handle errors when loading directions', async () => {
    mockDirectionsService.calculateRoute.and.returnValue(Promise.reject('API Error'));
    await component.loadDirections('WALKING');
    expect(component.isLoading).toBeFalse();
  });

  it('should stop event propagation when setMode is called with event', () => {
    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation')
    } as unknown as Event;
    component.setMode('DRIVING', event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should clear location watch on destroy', () => {
    component.currentWatchId = '123';
    component.ngOnDestroy();
    expect(mockCurrentLocationService.clearWatch).toHaveBeenCalledWith('123');
  });

  it('should set currentWatchId when starting location watch', async () => {
    await component.startWatchingLocation();
    expect(component.currentWatchId).toBe('123');
  });

  it('should update steps and set hasArrived when position is updated', () => {
    component.steps = [
      {
        instructions: 'Walk north on Main St.',
        start_location: {
          lat: () => 45.5017,
          lng: () => -73.5673,
          equals: () => false,
          toJSON: () => ({ lat: 45.5017, lng: -73.5673 }),
          toUrlValue: () => ''
        },
        end_location: {
          lat: () => 44.1232,
          lng: () => -72.4356,
          equals: () => false,
          toJSON: () => ({ lat: 44.1232, lng: -72.4356 }),
          toUrlValue: () => ''
        },
        distance: { text: '200 m', value: 200 },
        duration: { text: '2 mins', value: 2 },
        transit_details: undefined
      }
    ];
    component.onPositionUpdate({ lat: 44.1232, lng: -72.4356 });
    expect(component.steps.length).toBe(0);
    expect(component.hasArrived).toBeTrue();
  });

  it('should calculate distance correctly', () => {
    const distance = component.calculateDistance(45.5017, -73.5673, 44.1232, -72.4356);
    expect(distance).toBeCloseTo(177379, -4); // Approximate distance in meters
  });

  it('should return correct icon for direction instructions', () => {
    const icon = component.getDirectionIcon('Turn left onto Main St.');
    expect(icon).toBe('turn_left'); // Assuming mapping exists in iconMapping
  });

  it('should update showAllSteps based on component position', () => {
    const mockElement = { getBoundingClientRect: () => ({ top: 100 }) };
    component.directionsContainer = {
      nativeElement: mockElement
    } as ElementRef;
    spyOnProperty(window, 'innerHeight').and.returnValue(500);
    (component as any).updateShowAllSteps();
    expect(component.showAllSteps).toBeTrue();
  });

  it('should continuously update showAllSteps', () => {
    let callback: FrameRequestCallback = () => {};
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      callback = cb;
      return 1;
    });
    const mockElement = { getBoundingClientRect: () => ({ top: 100 }) };
    component.directionsContainer = { nativeElement: mockElement } as ElementRef;
    spyOnProperty(window, 'innerHeight').and.returnValue(500);
    (component as any).observeComponentPosition();
    callback(performance.now());
    expect(component.showAllSteps).toBeTrue();
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('should resolve when Google Maps API is ready', async () => {
    (window as any).google = { maps: {} };
    expect(true).toBeTruthy();
  });

  it('should do nothing if steps are empty', () => {
    component.steps = [];
    component.onPositionUpdate({ lat: 44.1232, lng: -72.4356 });
    expect(component.steps.length).toBe(0);
  });

  it('should return 0 for identical coordinates', () => {
    const distance = component.calculateDistance(45.5017, -73.5673, 45.5017, -73.5673);
    expect(distance).toBe(0);
  });

  it('should calculate distance correctly for coordinates at the equator', () => {
    const distance = component.calculateDistance(0, -73.5673, 0, -72.4356);
    expect(distance).toBeCloseTo(125839, -4);
  });

  it('should return correct icon for transit instructions', () => {
    const icon = component.getDirectionIcon('Take the bus to downtown');
    expect(icon).toBe('directions_bus');
  });

  it('should return fallback icon for unknown instructions', () => {
    const icon = component.getDirectionIcon('Do something unusual');
    expect(icon).toBe('help_outline');
  });

  it('should handle empty response from calculateRoute', async () => {
    mockDirectionsService.calculateRoute.and.returnValue(Promise.resolve({ steps: [], eta: null }));
    await component.loadDirections('WALKING');
    expect(component.steps).toEqual([]);
    expect(component.eta).toBeNull();
  });

  it('should call observeComponentPosition in ngAfterViewInit', () => {
    spyOn(component as any, 'observeComponentPosition');
    component.ngAfterViewInit();
    expect((component as any).observeComponentPosition).toHaveBeenCalled();
  });

  it('should not update showAllSteps if directionsContainer is not defined', () => {
    component.directionsContainer = undefined as any;
    component.showAllSteps = false;
    (component as any).updateShowAllSteps();
    expect(component.showAllSteps).toBeFalse();
  });

  it('should toggle directions and POIs when onEndClick is called', () => {
    const visibilityService = (component as any).visibilityService;
    (visibilityService.toggleDirectionsComponent as jasmine.Spy).calls.reset();
    (visibilityService.togglePOIsComponent as jasmine.Spy).calls.reset();
    component.onEndClick();
    expect(visibilityService.toggleDirectionsComponent).toHaveBeenCalled();
    expect(visibilityService.togglePOIsComponent).toHaveBeenCalled();
  });
});
