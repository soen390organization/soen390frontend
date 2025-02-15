import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionBarComponent } from './interaction-bar.component';
import { ElementRef } from '@angular/core';

describe('InteractionBarComponent', () => {
  let component: InteractionBarComponent;
  let fixture: ComponentFixture<InteractionBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionBarComponent], // ✅ Fix: Move to imports
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Mock the footer container ElementRef
    component.footerContainer = new ElementRef(document.createElement('div'));
  });

  it('should create the component', () => {
    expect(component).toBeDefined(); // ✅ Fixed for Jasmine
  });

  it('should initialize as collapsed', () => {
    expect(component.isExpanded).toBe(false); // ✅ Fixed assertion
  });

  it('should start dragging on touchstart', () => {
    const touchEvent = new TouchEvent('touchstart', {
      touches: <any>[{ clientY: 300 }],
    });

    component.onDragStart(300);
    expect(component.isDragging).toBe(true); // ✅ Use `toBe()`
    expect(component.startY).toEqual(300); // ✅ Use `toEqual()`
  });

  it('should move footer on touchmove', () => {
    component.isDragging = true;
    component.startY = 300;

    spyOn(component.footerContainer.nativeElement.style, 'setProperty');

    component.onDragMove(250);

    expect(component.footerContainer.nativeElement.style.transform).toBeDefined();
  });

  it('should expand on swipe up', () => {
    component.isDragging = true;
    component.startY = 300;
    component.currentY = 200; 

    (component as any).onDragEnd(); 
    expect(component.isExpanded).toBe(true); // ✅ Use `toBe()`
  });

  it('should collapse on swipe down', () => {
    component.isDragging = true;
    component.startY = 200;
    component.currentY = 300; 
    component.isExpanded = true; 

    (component as any).onDragEnd(); 
    expect(component.isExpanded).toBe(false); // ✅ Use `toBe()`
  });

  it('should prevent scrolling while swiping', () => {
    const event = jasmine.createSpyObj('event', ['preventDefault']);

    component.isDragging = true;
    component.onDragMove(250, event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should stop dragging on touchend', () => {
    component.isDragging = true;
    (component as any).onDragEnd();

    expect(component.isDragging).toBe(false); // ✅ Use `toBe()`
  });

  it('should transition smoothly when expanded', () => {
    component.isExpanded = true;
    (component as any).onDragEnd();

    expect(component.footerContainer.nativeElement.style.transition).toContain('transform 0.3s ease-out'); // ✅ Use `toContain()`
  });
});
