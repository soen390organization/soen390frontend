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
      imports: [InteractionBarComponent,SwitchMapButtonComponent,
        CommonModule],
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
    expect(component.footerContainer.nativeElement.style.transition).toContain('transform 0.3s ease-out');
  });

  it('should not expand or collapse if swipe distance is below threshold', () => {
    component.isDragging = true;
    component.isExpanded = false;
    component.startY = 300;
    component.currentY = 280; // Swipe of 20, threshold is 50
  
    component.onDragEnd();
  
    expect(component.isExpanded).toBeFalse(); // stays the same
  });

  it('should update transform and swipeProgress on drag move', () => {
    const footerElement = component.footerContainer.nativeElement;
  
    component.isExpanded = false;
    component.startY = 300;
    component.onDragMove(250); // drag upward by 50
  
    const expectedTranslateY = 80 - (component.startY - 250);
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80);
  
    expect(footerElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2);
  });

  it('should handle touchmove event via attachSwipeListeners', () => {
    component.swipeArea = new ElementRef(document.createElement('div'));
    component.attachSwipeListeners(component.swipeArea.nativeElement);
  
    component.isDragging = true;
    const touchEvent = new TouchEvent('touchmove', {
      cancelable: true,
      touches: [{ clientY: 250 }] as any
    });
  
    spyOn(touchEvent, 'preventDefault');
  
    component.swipeArea.nativeElement.dispatchEvent(touchEvent);
  
    expect(touchEvent.preventDefault).toHaveBeenCalled();
  });

  it('should update transform and swipeProgress on touch drag move', () => {
    // Create a dummy swipe area element
    const swipeElement = document.createElement('div');
    component.swipeArea = new ElementRef(swipeElement);
  
    // Set initial state for dragging
    component.isDragging = true;
    component.startY = 300;
  
    // Create a touch event using a custom event (since TouchEvent may not work in tests)
    const touchEvent = new Event('touchmove', { bubbles: true, cancelable: true }) as TouchEvent;
    // Define a touches property on the event
    Object.defineProperty(touchEvent, 'touches', {
      value: [{ clientY: 250 }], // dragged upward by 50
      writable: false,
    });
  
    // Spy on preventDefault on the event
    spyOn(touchEvent, 'preventDefault');
  
    // Dispatch the event
    swipeElement.dispatchEvent(touchEvent);
    fixture.detectChanges();
  
    // The component should update its footer transform style and swipeProgress accordingly.
    const expectedTranslateY = 80 - (component.startY - 250);
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80);
    expect(swipeElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2);
    expect(touchEvent.preventDefault).toHaveBeenCalled();
  });

  it('should update transform and swipeProgress on mouse drag move', () => {
    const swipeElement = document.createElement('div');
    component.swipeArea = new ElementRef(swipeElement);
    
    // Set initial state for dragging
    component.isDragging = true;
    component.startY = 300;
  
    // Create a synthetic MouseEvent for mousemove
    const mouseEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientY: 250
    });
    
    // Dispatch the event
    swipeElement.dispatchEvent(mouseEvent);
    fixture.detectChanges();
    
    // Calculate expected values
    const expectedTranslateY = 80 - (300 - 250);
    const clampedTranslate = Math.min(Math.max(expectedTranslateY, 0), 80);
    expect(swipeElement.style.transform).toContain(`translateY(${clampedTranslate}%)`);
    expect(component.swipeProgress).toBeCloseTo((80 - clampedTranslate) / 80, 2);
  });
  
  it('should set isExpanded to true when swipe distance exceeds threshold', () => {
    component.isDragging = true;
    component.startY = 300;
    component.currentY = 200; // swipe upward by 100 (threshold 50)
    spyOn(component, 'updateFooterUI');
  
    component.onDragEnd();
  
    expect(component.isExpanded).toBeTrue();
    expect(component.updateFooterUI).toHaveBeenCalledWith(true);
  });

  it('should set isExpanded to false when swipe distance exceeds negative threshold', () => {
    component.isDragging = true;
    component.startY = 200;
    component.currentY = 300; // swipe downward by 100 (threshold 50)
    spyOn(component, 'updateFooterUI');
  
    component.onDragEnd();
  
    expect(component.isExpanded).toBeFalse();
    expect(component.updateFooterUI).toHaveBeenCalledWith(false);
  });

  it('should not change isExpanded when swipe distance is below threshold', () => {
    component.isDragging = true;
    component.startY = 300;
    component.currentY = 280; // swipe of 20, below threshold 50
    component.isExpanded = false; // initial state
    spyOn(component, 'updateFooterUI');
  
    component.onDragEnd();
  
    expect(component.isExpanded).toBeFalse();
    expect(component.updateFooterUI).toHaveBeenCalledWith(false);
  });


});


