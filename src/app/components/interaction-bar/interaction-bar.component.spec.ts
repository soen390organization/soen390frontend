import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { InteractionBarComponent } from './interaction-bar.component';

describe('InteractionBarComponent', () => {
  let component: InteractionBarComponent;
  let fixture: ComponentFixture<InteractionBarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), InteractionBarComponent]  // Move InteractionBarComponent to imports
    }).compileComponents();

    fixture = TestBed.createComponent(InteractionBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle isExpanded when toggleExpand is called', () => {
    // Initially, isExpanded should be false
    expect(component.isExpanded).toBeFalse();

    // Call toggleExpand
    component.toggleExpand();
    expect(component.isExpanded).toBeTrue();  // After first call, should be true

    // Call toggleExpand again
    component.toggleExpand();
    expect(component.isExpanded).toBeFalse();  // After second call, should be false again
  });
});
