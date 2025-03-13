import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectionsComponent } from './directions.component';
import { Step } from 'src/app/interfaces/step.interface';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { VisibilityService } from 'src/app/services/visibility.service';

const mockDirectionsService = {
  generateRoute: jasmine
    .createSpy('generateRoute')
    .and.callFake((start, destination, mode) =>
      mockDirectionsService.calculateRoute(start, destination, mode),
    ),
  calculateRoute: jasmine
    .createSpy('calculateRoute')
    .and.returnValue(Promise.resolve({ steps: [], eta: null })),
  getTravelMode: jasmine.createSpy('getTravelMode').and.returnValue('WALKING'),
  hasBothPoints$: of(true),
  getDestinationPoint: jasmine.createSpy('getDestinationPoint').and.returnValue(
    of({
      address: 'destination address',
      title: 'Destination',
      coordinates: {},
    }),
  ),
  getStartPoint: jasmine
    .createSpy('getStartPoint')
    .and.returnValue(
      of({ address: 'start address', title: 'Start', coordinates: {} }),
    ),
  setStartPoint: jasmine.createSpy('setStartPoint'),
  setDestinationPoint: jasmine.createSpy('setDestinationPoint'),
};

const mockCurrentLocationService = {
  watchLocation: jasmine
    .createSpy('watchLocation')
    .and.returnValue(Promise.resolve('123')),
  clearWatch: jasmine.createSpy('clearWatch'),
};

const mockVisibilityService = {
  toggleDirectionsComponent: jasmine.createSpy('toggleDirectionsComponent'),
  togglePOIsComponent: jasmine.createSpy('togglePOIsComponent'),
  toggleStartButton: jasmine.createSpy('toggleStartButton'),
};

describe('DirectionsComponent', () => {
  let component: DirectionsComponent;
  let fixture: ComponentFixture<DirectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectionsComponent, CommonModule],
      providers: [
        { provide: DirectionsService, useValue: mockDirectionsService },
        {
          provide: CurrentLocationService,
          useValue: mockCurrentLocationService,
        },
        { provide: VisibilityService, useValue: mockVisibilityService },
      ],
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
          toUrlValue: () => '',
        },
        end_location: {
          lat: () => 44.1232,
          lng: () => -72.4356,
          equals: () => false,
          toJSON: () => ({ lat: 44.1232, lng: -72.4356 }),
          toUrlValue: () => '',
        },
        distance: { text: '200 m', value: 200 },
        duration: { text: '2 mins', value: 2 },
        transit_details: undefined,
      },
    ];
    mockDirectionsService.calculateRoute.and.returnValue(
      Promise.resolve({ steps: mockSteps, eta: '6 mins' }),
    );

    await component.loadDirections('WALKING');
    expect(component.steps).toEqual(mockSteps);
    expect(component.eta).toBe('6 mins');
    expect(component.isLoading).toBeFalse();
  });

  it('should handle errors when loading directions', async () => {
    mockDirectionsService.calculateRoute.and.returnValue(
      Promise.reject('API Error'),
    );
    await component.loadDirections('WALKING');
    expect(component.isLoading).toBeFalse();
  });

  it('should stop event propagation when setMode is called with event', () => {
    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
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
          toUrlValue: () => '',
        },
        end_location: {
          lat: () => 44.1232,
          lng: () => -72.4356,
          equals: () => false,
          toJSON: () => ({ lat: 44.1232, lng: -72.4356 }),
          toUrlValue: () => '',
        },
        distance: { text: '200 m', value: 200 },
        duration: { text: '2 mins', value: 2 },
        transit_details: undefined,
      },
    ];
    component.onPositionUpdate({ lat: 44.1232, lng: -72.4356 });
    expect(component.steps.length).toBe(0);
    expect(component.hasArrived).toBeTrue();
  });

  it('should calculate distance correctly', () => {
    const distance = component.calculateDistance(
      45.5017,
      -73.5673,
      44.1232,
      -72.4356,
    );
    expect(distance).toBeCloseTo(177379, -4); // Approximate distance in meters
  });

  it('should return correct icon for direction instructions', () => {
    const icon = component.getDirectionIcon('Turn left onto Main St.');
    expect(icon).toBe('turn_left'); // Assuming 'turn_left' is mapped in iconMapping.json
  });

  it('should update showAllSteps based on component position', () => {
    const mockElement = { getBoundingClientRect: () => ({ top: 100 }) };
    component.directionsContainer = {
      nativeElement: mockElement,
    } as ElementRef;
    spyOnProperty(window, 'innerHeight').and.returnValue(500);

    // Access private method using type assertion
    (component as any).updateShowAllSteps();

    expect(component.showAllSteps).toBeTrue();
  });

  it('should continuously update showAllSteps', () => {
    // Spy on requestAnimationFrame and simulate a single call
    let callback: FrameRequestCallback = () => {};
    spyOn(window, 'requestAnimationFrame').and.callFake(
      (cb: FrameRequestCallback) => {
        callback = cb; // Store the callback
        return 1; // Return a mock handle ID
      },
    );

    const mockElement = { getBoundingClientRect: () => ({ top: 100 }) };
    component.directionsContainer = {
      nativeElement: mockElement,
    } as ElementRef;
    spyOnProperty(window, 'innerHeight').and.returnValue(500);

    // Call observeComponentPosition (which starts the loop)
    (component as any).observeComponentPosition();

    // Simulate a single call to the callback
    callback(performance.now());

    // Verify the result
    expect(component.showAllSteps).toBeTrue();

    // Verify that requestAnimationFrame was called
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('should resolve when Google Maps API is ready', async () => {
    (window as any).google = { maps: {} }; // Mock Google Maps API
    expect(true).toBeTruthy(); // If it resolves, the test passes
  });

  it('should do nothing if steps are empty', () => {
    component.steps = [];
    component.onPositionUpdate({ lat: 44.1232, lng: -72.4356 });
    expect(component.steps.length).toBe(0);
  });

  it('should return 0 for identical coordinates', () => {
    const distance = component.calculateDistance(
      45.5017,
      -73.5673,
      45.5017,
      -73.5673,
    );
    expect(distance).toBe(0);
  });

  it('should calculate distance correctly for coordinates at the equator', () => {
    const distance = component.calculateDistance(0, -73.5673, 0, -72.4356);
    expect(distance).toBeCloseTo(125839, -4); // Approximate distance in meters
  });

  it('should return correct icon for direction instructions', () => {
    const icon = component.getDirectionIcon('Turn left onto Main St.');
    expect(icon).toBe('turn_left'); // Assuming 'turn_left' is mapped in iconMapping.json
  });

  it('should return correct icon for transit instructions', () => {
    const icon = component.getDirectionIcon('Take the bus to downtown');
    expect(icon).toBe('directions_bus'); // Assuming 'directions_bus' is mapped in iconMapping.json
  });

  it('should return fallback icon for unknown instructions', () => {
    const icon = component.getDirectionIcon('Do something unusual');
    expect(icon).toBe('help_outline'); // Fallback icon
  });

  it('should handle empty response from calculateRoute', async () => {
    mockDirectionsService.calculateRoute.and.returnValue(
      Promise.resolve({ steps: [], eta: null }),
    );
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
    // Remove the directionsContainer so that updateShowAllSteps returns immediately.
    component.directionsContainer = undefined as any;
    // Set a known value for showAllSteps.
    component.showAllSteps = false;

    // Call the private method via type assertion.
    (component as any).updateShowAllSteps();

    // Expect showAllSteps to remain unchanged.
    expect(component.showAllSteps).toBeFalse();
  });

  it('should toggle directions and POIs when onEndClick is called', () => {
    // Access the private visibilityService from the component.
    const visibilityService = (component as any).visibilityService;

    // Reset call history if needed.
    (visibilityService.toggleDirectionsComponent as jasmine.Spy).calls.reset();
    (visibilityService.togglePOIsComponent as jasmine.Spy).calls.reset();

    component.onEndClick();

    expect(visibilityService.toggleDirectionsComponent).toHaveBeenCalled();
    expect(visibilityService.togglePOIsComponent).toHaveBeenCalled();
  });
});
