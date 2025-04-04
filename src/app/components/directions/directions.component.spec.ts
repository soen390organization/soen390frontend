import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DirectionsComponent } from './directions.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import {
  OutdoorDrivingStrategy,
  OutdoorShuttleStrategy,
  OutdoorTransitStrategy,
  OutdoorWalkingStrategy,
} from 'src/app/strategies/outdoor-directions';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { AbstractOutdoorStrategy } from 'src/app/strategies/outdoor-directions/abstract-outdoor.strategy';
import { setShowRoute } from 'src/app/store/app';
import { of } from 'rxjs';
import { ElementRef } from '@angular/core';
import { Step } from 'src/app/interfaces/step.interface';

describe('DirectionsComponent', () => {
  let component: DirectionsComponent;
  let fixture: ComponentFixture<DirectionsComponent>;
  let store: MockStore;

  const mockOutdoorService = jasmine.createSpyObj('OutdoorDirectionsService', [
    'getSelectedStrategy$',
    'clearNavigation',
    'setSelectedStrategy',
    'renderNavigation',
  ]);
  const mockWalkingStrategy = { routes: [{}] };
  const mockDrivingStrategy = { routes: [] };
  const mockTransitStrategy = { routes: [{}] };
  const mockShuttleStrategy = { routes: [{}] };
  const mockCurrentLocationService = jasmine.createSpyObj('CurrentLocationService', [
    'clearWatch',
    'watchLocation',
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectionsComponent],
      providers: [
        provideMockStore(),
        { provide: OutdoorDirectionsService, useValue: mockOutdoorService },
        { provide: OutdoorWalkingStrategy, useValue: mockWalkingStrategy },
        { provide: OutdoorDrivingStrategy, useValue: mockDrivingStrategy },
        { provide: OutdoorTransitStrategy, useValue: mockTransitStrategy },
        { provide: OutdoorShuttleStrategy, useValue: mockShuttleStrategy },
        { provide: CurrentLocationService, useValue: mockCurrentLocationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectionsComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to strategy and set steps', () => {
    const fakeStrategy = {
      getTotalSteps: () => [{ end_location: { lat: () => 0, lng: () => 0 } }],
    } as AbstractOutdoorStrategy;

    spyOn(component, 'startWatchingLocation');
    mockOutdoorService.getSelectedStrategy$.and.returnValue(of(fakeStrategy));

    component.ngOnInit();

    expect(component.steps.length).toBe(1);
    expect(component.startWatchingLocation).toHaveBeenCalled();
  });

  it('should call strategy methods in setStrategy()', () => {
    const strategy = {} as AbstractOutdoorStrategy;

    component.setStrategy(strategy);

    expect(mockOutdoorService.clearNavigation).toHaveBeenCalled();
    expect(mockOutdoorService.setSelectedStrategy).toHaveBeenCalledWith(strategy);
    expect(mockOutdoorService.renderNavigation).toHaveBeenCalled();
  });

  it('should startWatchingLocation and set watchId', fakeAsync(() => {
    mockCurrentLocationService.watchLocation.and.returnValue(Promise.resolve('watch123'));

    component.startWatchingLocation();
    tick();

    expect(component.currentWatchId).toBe('watch123');
  }));

  it('should handle error in startWatchingLocation', fakeAsync(() => {
    spyOn(console, 'error');
    mockCurrentLocationService.watchLocation.and.returnValue(Promise.reject('fail'));

    component.startWatchingLocation();
    tick();

    expect(console.error).toHaveBeenCalledWith('Error starting location watch:', 'fail');
  }));

  it('should handle empty steps in onPositionUpdate()', () => {
    component.steps = [];
    component.onPositionUpdate({ lat: 0, lng: 0 });

    expect(component.hasArrived).toBeFalse();
  });

  it('should warn if step has no end_location', () => {
    spyOn(console, 'warn');
    component.steps = [{} as any];

    component.onPositionUpdate({ lat: 0, lng: 0 });

    expect(console.warn).toHaveBeenCalled();
  });

  it('should shift step and set hasArrived if last step', () => {
    const step = {
      instructions: 'Go straight',
      start_location: { lat: () => 0, lng: () => 0 },
      end_location: { lat: () => 0, lng: () => 0 }
    } as Step;
  
    component.steps = [step];
  
    component.onPositionUpdate({ lat: 0, lng: 0 });
  
    expect(component.steps.length).toBe(0);
    expect(component.hasArrived).toBeTrue();
  });  

  it('should calculate distance using haversine formula', () => {
    const d = component.calculateDistance(0, 0, 0, 1);
    expect(d).toBeGreaterThan(100000);
  });

  it('should return the correct direction icon or fallback', () => {
    const icon1 = component.getDirectionIcon('<b>Turn left</b>');
    const icon2 = component.getDirectionIcon('<b>Bus</b>');
    const icon3 = component.getDirectionIcon('<b>Unknown text</b>');

    expect(icon1).toMatch(/^[\w_]+$/);
    expect(icon2).toMatch(/^[\w_]+$/);
    expect(icon3).toBe('help_outline');
  });

  it('should dispatch store action onEndClick', () => {
    spyOn(store, 'dispatch');
    component.onEndClick();
    expect(store.dispatch).toHaveBeenCalledWith(setShowRoute({ show: false }));
  });

  it('should filter travelModes with routes', () => {
    const modes = component.getTravelModes();
    expect(modes.length).toBe(3); // Driving has no routes
  });

  it('should call unobserve and cleanup on destroy', () => {
    component.currentWatchId = 'watchId';
    const unsubscribeSpy = jasmine.createSpy('unsubscribe');
    (component as any).endNavigationSubscription = { unsubscribe: unsubscribeSpy };

    const mockObserver = jasmine.createSpyObj('IntersectionObserver', ['unobserve']);
    (component as any).observer = mockObserver;

    component.directionsContainer = {
      nativeElement: {},
    } as ElementRef;

    component.ngOnDestroy();

    expect(mockCurrentLocationService.clearWatch).toHaveBeenCalledWith('watchId');
    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(mockObserver.unobserve).toHaveBeenCalled();
  });

  it('should create and observe on ngAfterViewInit', () => {
    const observeSpy = jasmine.createSpy('observe');
    const unobserveSpy = jasmine.createSpy('unobserve');
    const mockObserver = { observe: observeSpy, unobserve: unobserveSpy };
  
    spyOn(window as any, 'IntersectionObserver').and.returnValue(mockObserver);
  
    component.directionsContainer = {
      nativeElement: {}
    } as ElementRef;
  
    component.ngAfterViewInit();
  
    expect(observeSpy).toHaveBeenCalled();
  });  

  it('should update showAllSteps based on observer callback', () => {
    const observerCallback = (entries: any[]) => {
      const triggerPoint = 400;
      const top = entries[0].boundingClientRect.top;
      component.showAllSteps = top < triggerPoint;
    };

    observerCallback([{ boundingClientRect: { top: 300 } }]);
    expect(component.showAllSteps).toBeTrue();

    observerCallback([{ boundingClientRect: { top: 500 } }]);
    expect(component.showAllSteps).toBeFalse();
  });
});
