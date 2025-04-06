import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionBarComponent } from './interaction-bar.component';
import { ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { MapType, selectCurrentMap, selectSelectedCampus } from 'src/app/store/app';
import { PlacesService } from 'src/app/services/places/places.service';
import { VisibilityService } from 'src/app/services/visibility.service';
import { SwitchMapButtonComponent } from '../switch-map-button/switch-map-button.component';
import { provideMockStore } from '@ngrx/store/testing';
import { CommonModule } from '@angular/common';

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

describe('InteractionBarComponent', () => {
  let component: InteractionBarComponent;
  let fixture: ComponentFixture<InteractionBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionBarComponent, SwitchMapButtonComponent, CommonModule],
      providers: [
        provideMockStore({ initialState: {} }),
        { provide: Store, useValue: mockStore },
        { provide: PlacesService, useValue: mockPlacesService },
        { provide: VisibilityService, useValue: mockVisibilityService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionBarComponent);
    component = fixture.componentInstance;
    // Set a dummy footer container so that DOM updates are testable.
    component.footerContainer = new ElementRef(document.createElement('div'));
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should initialize as collapsed', () => {
    expect(component.isExpanded).toBeFalse();
  });

  it('should set isDragging to true on drag start', () => {
    component.onDragStart(300);
    expect(component.isDragging).toBeTrue();
    expect(component.startY).toBe(300);
  });

  it('should stop dragging on drag end', () => {
    component.isDragging = true;
    component.onDragEnd();
    expect(component.isDragging).toBeFalse();
  });

  it('should collapse on swipe down', () => {
    component.isDragging = true;
    component.startY = 200;
    component.currentY = 300;
    component.isExpanded = true;
    component.onDragEnd();
    expect(component.isExpanded).toBeFalse();
  });

  it('should toggle isExpanded when handleClick is called', () => {
    expect(component.isExpanded).toBeFalse();
    component.handleClick();
    expect(component.isExpanded).toBeTrue();
    component.handleClick();
    expect(component.isExpanded).toBeFalse();
  });

  it('should transition smoothly when expanded', () => {
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
    expect(component.footerContainer.nativeElement.style.transform).toBe('translateY(65%)');
    expect(component.footerContainer.nativeElement.style.overflowY).toBe('');
    expect(component.swipeProgress).toBe(0);
  });

  it('should not expand or collapse if swipe distance is below threshold', () => {
    component.isDragging = true;
    component.isExpanded = false;
    component.startY = 300;
    component.currentY = 280;

    component.onDragEnd();

    expect(component.isExpanded).toBeFalse();
  });

  it('should update transform and swipeProgress on drag move', () => {
    const footerElement = component.footerContainer.nativeElement;
    component.isExpanded = false;
    component.startY = 300;
    component.onDragMove(250);

    const expectedTranslateY = 80 - (300 - 250);
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80);

    expect(footerElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2);
  });

  it('should handle touchmove event via attachSwipeListeners', () => {
    component.swipeArea = new ElementRef(document.createElement('div'));
    component.attachSwipeListeners(component.swipeArea.nativeElement);

    component.isDragging = true;

    const touchEvent = new Event('touchmove', { bubbles: true, cancelable: true }) as TouchEvent;
    Object.defineProperty(touchEvent, 'touches', {
      value: [{ clientY: 250 }],
      writable: false
    });
    spyOn(touchEvent, 'preventDefault');

    component.swipeArea.nativeElement.dispatchEvent(touchEvent);
    expect(touchEvent.preventDefault).toHaveBeenCalled();
  });

  it('should update transform and swipeProgress on touch drag move', () => {
    const footerElement = document.createElement('div');
    component.footerContainer = new ElementRef(footerElement);

    component.isDragging = true;
    component.startY = 300;
    component.onDragMove(250);

    const expectedTranslateY = 80 - (300 - 250); // = 30
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80);

    expect(footerElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2);
  });

  it('should update transform and swipeProgress on mouse drag move', () => {
    const swipeElement = document.createElement('div');
    const footerElement = document.createElement('div');
    component.swipeArea = new ElementRef(swipeElement);
    component.footerContainer = new ElementRef(footerElement);

    component.attachSwipeListeners(swipeElement);

    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientY: 300
    });
    swipeElement.dispatchEvent(mousedownEvent);
    fixture.detectChanges();

    const mousemoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientY: 250
    });
    const preventDefaultSpy = spyOn(mousemoveEvent, 'preventDefault').and.callThrough();

    document.dispatchEvent(mousemoveEvent);
    fixture.detectChanges();

    expect(footerElement.style.transform).toContain('translateY(30%)');
    expect(component.swipeProgress).toBeCloseTo(0.625, 2);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should set isExpanded to false when swipe distance exceeds negative threshold', () => {
    component.isDragging = true;
    component.startY = 200;
    component.currentY = 300;
    spyOn(component, 'updateFooterUI');

    component.onDragEnd();

    expect(component.isExpanded).toBeFalse();
    expect(component.updateFooterUI).toHaveBeenCalledWith(false);
  });

  it('should not change isExpanded when swipe distance is below threshold', () => {
    component.isDragging = true;
    component.startY = 300;
    component.currentY = 280;
    component.isExpanded = false;
    spyOn(component, 'updateFooterUI');

    component.onDragEnd();

    expect(component.isExpanded).toBeFalse();
    expect(component.updateFooterUI).toHaveBeenCalledWith(false);
  });

  it('should update footer UI correctly when expanded', () => {
    // Test updateFooterUI directly for the expanded state.
    const footerElement = document.createElement('div');
    component.footerContainer = new ElementRef(footerElement);
    component.updateFooterUI(true);
    expect(footerElement.style.transition).toContain('transform 0.3s ease-out');
    // Updated expectation: now expecting 'translateY(0px)' instead of 'translateY(0)'
    expect(footerElement.style.transform).toBe('translateY(0px)');
    expect(component.swipeProgress).toBe(1);
  });

  it('should update footer UI correctly when collapsed', () => {
    // Test updateFooterUI directly for the collapsed state.
    const footerElement = document.createElement('div');
    component.footerContainer = new ElementRef(footerElement);
    component.updateFooterUI(false);
    expect(footerElement.style.transition).toContain('transform 0.3s ease-out');
    expect(footerElement.style.transform).toBe('translateY(80%)');
    expect(component.swipeProgress).toBe(0);
  });

  it('should update transform and swipeProgress on drag move when expanded', () => {
    // When expanded, baseTranslate should be 0.
    const footerElement = document.createElement('div');
    component.footerContainer = new ElementRef(footerElement);
    component.isExpanded = true;
    component.startY = 300;
    component.onDragMove(350); // currentY = 350, diff = 300 - 350 = -50, translateY = 0 - (-50) = 50
    const expectedTranslateY = 0 - (300 - 350); // = 50
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80); // = 50
    expect(footerElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2); // (80-50)/80 = 0.375
  });

  it('should reset startY and currentY after drag end', () => {
    component.isDragging = true;
    component.startY = 300;
    component.currentY = 250;
    component.onDragEnd();
    expect(component.startY).toBe(0);
    expect(component.currentY).toBe(0);
  });

  it('should not call onShowMore when handleClick is triggered while dragging', () => {
    component.isDragging = true;
    spyOn(component, 'onShowMore');
    component.handleClick();
    expect(component.onShowMore).not.toHaveBeenCalled();
  });

  it('should toggle isExpanded and update footer UI when onShowMore is called', () => {
    spyOn(component, 'updateFooterUI');
    component.isExpanded = false;
    component.onShowMore();
    expect(component.isExpanded).toBeTrue();
    expect(component.updateFooterUI).toHaveBeenCalledWith(true);
    component.onShowMore();
    expect(component.isExpanded).toBeFalse();
    expect(component.updateFooterUI).toHaveBeenCalledWith(false);
  });

  it('should not start dragging on touchstart if multiple touches are present', () => {
    const element = document.createElement('div');
    component.swipeArea = new ElementRef(element);
    component.attachSwipeListeners(element);
    spyOn(component, 'onDragStart');

    // Create a proper TouchEvent with two touches.
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [
        new Touch({
          identifier: 0,
          target: element,
          clientX: 0,
          clientY: 300,
          screenX: 0,
          screenY: 300,
          pageX: 0,
          pageY: 300
        }),
        new Touch({
          identifier: 1,
          target: element,
          clientX: 0,
          clientY: 310,
          screenX: 0,
          screenY: 310,
          pageX: 0,
          pageY: 310
        })
      ]
    });
    element.dispatchEvent(touchEvent);
    expect(component.onDragStart).not.toHaveBeenCalled();
  });

  it('should set showIndoorSelects based on current map type', () => {
    component.ngOnInit();
    expect(component.showIndoorSelects).toBeFalse();
    (mockStore.select as jasmine.Spy).and.callFake((selector: any) => {
      if (selector === selectCurrentMap) {
        return of(MapType.Indoor);
      }
      if (selector === selectSelectedCampus) {
        return of('someCampus');
      }
      return of();
    });
    component.ngOnInit();
    expect(component.showIndoorSelects).toBeTrue();
  });

  it('should update campusBuildings and pointsOfInterest after placesService isInitialized', () => {
    component.ngOnInit();
    expect(component.campusBuildings.loading).toBeFalse();
    expect(component.pointsOfInterest.loading).toBeFalse();
  });
});
