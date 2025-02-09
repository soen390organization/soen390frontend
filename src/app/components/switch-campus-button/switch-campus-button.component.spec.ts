import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SwitchCampusButtonComponent } from './switch-campus-button.component';

describe('SwitchCampusButtonComponent', () => {
  let component: SwitchCampusButtonComponent;
  let fixture: ComponentFixture<SwitchCampusButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), SwitchCampusButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchCampusButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should switch campus correctly', () => {
    expect(component.selectedCampus).toBe('SGW'); // Initial state

    component.switchCampus();
    expect(component.selectedCampus).toBe('LOY'); // After first switch

    component.switchCampus();
    expect(component.selectedCampus).toBe('SGW'); // After second switch
  });
});
