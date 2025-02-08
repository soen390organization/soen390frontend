import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleMapComponent } from './google-map.component';
import { IonicModule } from '@ionic/angular';

describe('GoogleMapComponent', () => {
  let component: GoogleMapComponent;
  let fixture: ComponentFixture<GoogleMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), GoogleMapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleMapComponent);
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
