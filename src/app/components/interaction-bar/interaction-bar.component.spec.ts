import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionBarComponent } from './interaction-bar.component';
import { ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { MapType, selectCurrentMap, selectSelectedCampus } from 'src/app/store/app';
import { PlacesService } from 'src/app/services/places/places.service';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { VisibilityService } from 'src/app/services/visibility.service';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';

describe('InteractionBarComponent', () => {
  let component: InteractionBarComponent;
  let fixture: ComponentFixture<InteractionBarComponent>;
  let mockStore: jasmine.SpyObj<Store<any>>;
  let mockPlacesService: any;
  let mockDirectionsService: any;
  let mockVisibilityService: any;

  beforeEach(async () => {
    // Create a spy object for Store with 'select' and 'dispatch'
    mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    // Setup the store.select method to return observables for expected selectors
    mockStore.select.and.callFake((selector: any) => {
      if (selector === selectCurrentMap) {
        return of(MapType.Outdoor);
      }
      if (selector === selectSelectedCampus) {
        return of('someCampus');
      }
      return of();
    });

    // Provide dummy implementations for the other services
    mockPlacesService = {
      isInitialized: () => of(true),
      getCampusBuildings: () => of([]),
      getPointsOfInterest: () => of([])
    };

    const mockDirectionsService = {
      hasBothPoints$: of(true)
    };
    mockVisibilityService = {
      showDirections: of(true),
      showPOIs: of(true)
    };

    await TestBed.configureTestingModule({
      imports: [InteractionBarComponent],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: PlacesService, useValue: mockPlacesService },
        { provide: DirectionsService, useValue: mockDirectionsService },
        { provide: VisibilityService, useValue: mockVisibilityService },
        { provide: NavigationCoordinatorService, useValue: { globalRoute$: of({ segments: [] }) } }
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
});
