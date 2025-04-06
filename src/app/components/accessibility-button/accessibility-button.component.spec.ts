import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccessibilityButtonComponent } from './accessibility-button.component';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { AbstractIndoorStrategy } from 'src/app/strategies/indoor-directions/abstract-indoor.strategy';

describe('AccessibilityButtonComponent', () => {
  let component: AccessibilityButtonComponent;
  let fixture: ComponentFixture<AccessibilityButtonComponent>;
  let indoorDirectionsServiceMock: jasmine.SpyObj<IndoorDirectionsService>;

  beforeEach(async () => {
    indoorDirectionsServiceMock = jasmine.createSpyObj('IndoorDirectionsService', [
      'getSelectedStrategy',
      'getSelectedStrategy$',
      'renderNavigation'
    ]);

    await TestBed.configureTestingModule({
      imports: [AccessibilityButtonComponent],
      providers: [{ provide: IndoorDirectionsService, useValue: indoorDirectionsServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(AccessibilityButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle accessibility and render navigation', async () => {
    const toggleSpy = jasmine.createSpy('toggleAccessibility');

    // Use the same spy here
    indoorDirectionsServiceMock.getSelectedStrategy.and.returnValue(
      Promise.resolve({
        toggleAccessibility: toggleSpy,
        accessibility: false,
        route: [],
        mappedinService: null as any,
        isAccessibilityEnabled: () => false,
        updateStrategySettings: () => {},
        getRoute: async () => [],
        calculateRoute: async () => {},
        renderRoute: async () => {},
        clear: () => {}
      } as unknown as AbstractIndoorStrategy)
    );

    await component.toggleAccessibility();

    expect(indoorDirectionsServiceMock.getSelectedStrategy).toHaveBeenCalled();
    expect(toggleSpy).toHaveBeenCalled(); // Now this will work ✅
    expect(indoorDirectionsServiceMock.renderNavigation).toHaveBeenCalled();
  });
});
