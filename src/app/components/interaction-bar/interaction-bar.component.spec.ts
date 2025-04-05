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
      imports: [
        // Since InteractionBarComponent and SwitchMapButtonComponent are standalone,
        // include them in the imports. CommonModule is also required.
        InteractionBarComponent,
        SwitchMapButtonComponent,
        CommonModule
      ],
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
    // When not dragging, handleClick should toggle the expanded state.
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

  it('should not expand or collapse if swipe distance is below threshold', () => {
    component.isDragging = true;
    component.isExpanded = false;
    component.startY = 300;
    component.currentY = 280; // Swipe of 20, below threshold (50)

    component.onDragEnd();

    expect(component.isExpanded).toBeFalse();
  });

  it('should update transform and swipeProgress on drag move', () => {
    const footerElement = component.footerContainer.nativeElement;
    component.isExpanded = false;
    component.startY = 300;
    component.onDragMove(250); // drag upward by 50

    const expectedTranslateY = 80 - (300 - 250);
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80);

    expect(footerElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2);
  });

  it('should handle touchmove event via attachSwipeListeners', () => {
    // In the original test, a TouchEvent might have been created directly,
    // which could cause type conversion issues. Here, we create a generic Event
    // and override its touches property using Object.defineProperty.
    component.swipeArea = new ElementRef(document.createElement('div'));
    component.attachSwipeListeners(component.swipeArea.nativeElement);

    component.isDragging = true;
    // Create a synthetic touch event and manually define the touches property.
    const touchEvent = new Event('touchmove', { bubbles: true, cancelable: true }) as TouchEvent;
    Object.defineProperty(touchEvent, 'touches', {
      value: [{ clientY: 250 }],
      writable: false
    });
    // Spy on preventDefault to ensure that it is called in our onMove handler.
    spyOn(touchEvent, 'preventDefault');

    // Dispatch the event on the swipeArea element.
    component.swipeArea.nativeElement.dispatchEvent(touchEvent);
    // Verify that preventDefault was called as expected.
    expect(touchEvent.preventDefault).toHaveBeenCalled();
  });

  it('should update transform and swipeProgress on touch drag move', () => {
    // In the original version, the test expected the transform update on the element
    // that received the event (swipeArea), but the refactored code applies the update
    // to footerContainer. So here, we set up footerContainer and then directly call onDragMove.
    const footerElement = document.createElement('div');
    component.footerContainer = new ElementRef(footerElement);

    component.isDragging = true;
    component.startY = 300;
    // Instead of simulating an event, we directly call onDragMove with the new clientY.
    component.onDragMove(250);

    // Calculate the expected transform:
    // startY (300) - currentY (250) gives diff = 50, so translateY = 80 - 50 = 30.
    const expectedTranslateY = 80 - (300 - 250); // = 30
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80); // = 30

    // Verify that footerContainer's transform is updated accordingly.
    expect(footerElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    // Verify that the swipeProgress is correctly calculated.
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2);
  });

  it('should update transform and swipeProgress on mouse drag move', () => {
    // In the original test, mousemove events were dispatched directly on swipeArea,
    // but in the refactored version the component attaches the mousemove listener
    // to the document after a mousedown on swipeArea.
    // Therefore, we now create two elements: one for swipeArea (event dispatch)
    // and one for footerContainer (for checking style updates).
    const swipeElement = document.createElement('div');
    const footerElement = document.createElement('div');
    component.swipeArea = new ElementRef(swipeElement);
    component.footerContainer = new ElementRef(footerElement);

    // Attach the swipe listeners on the swipeElement.
    component.attachSwipeListeners(swipeElement);

    // Simulate a mousedown on the swipeArea to register the document-level mousemove listener.
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientY: 300 // starting position
    });
    swipeElement.dispatchEvent(mousedownEvent);
    fixture.detectChanges();

    // Create a synthetic mousemove event. Note that now we dispatch it on the document,
    // because that's where the listener was attached during mousedown.
    const mousemoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientY: 250 // new position after dragging
    });
    // Spy on preventDefault to verify it is called by the event handler.
    const preventDefaultSpy = spyOn(mousemoveEvent, 'preventDefault').and.callThrough();

    // Dispatch the mousemove event on the document.
    document.dispatchEvent(mousemoveEvent);
    fixture.detectChanges();

    // Calculate the expected values:
    // Diff = 300 - 250 = 50; so translateY becomes 80 - 50 = 30, and swipeProgress becomes (80 - 30)/80 = 0.625.
    expect(footerElement.style.transform).toContain('translateY(30%)');
    expect(component.swipeProgress).toBeCloseTo(0.625, 2);
    // Verify that preventDefault was called.
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should set isExpanded to false when swipe distance exceeds negative threshold', () => {
    // This test remains similar to the original.
    // It ensures that when the swipe distance is negative (swiping down)
    // beyond the threshold, the component collapses (isExpanded becomes false).
    component.isDragging = true;
    component.startY = 200;
    component.currentY = 300; // swipe downward by 100 (exceeds the threshold of 50)
    spyOn(component, 'updateFooterUI');

    component.onDragEnd();

    expect(component.isExpanded).toBeFalse();
    expect(component.updateFooterUI).toHaveBeenCalledWith(false);
  });

  it('should not change isExpanded when swipe distance is below threshold', () => {
    component.isDragging = true;
    component.startY = 300;
    component.currentY = 280; // swipe of 20, below threshold 50
    component.isExpanded = false;
    spyOn(component, 'updateFooterUI');

    component.onDragEnd();

    expect(component.isExpanded).toBeFalse();
    expect(component.updateFooterUI).toHaveBeenCalledWith(false);
  });
});
