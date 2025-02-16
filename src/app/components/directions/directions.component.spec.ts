import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { DirectionsComponent } from './directions.component';
import { Step } from 'src/app/interfaces/step.interface';

// Mock the calculateRoute function
function mockCalculateRoute(mode: string): Promise<{ steps: Step[]; eta: string | null }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let response: { steps: Step[]; eta: string | null } = { steps: [], eta: null };

      if (mode === 'WALKING') {
        response = {
          steps: [
            {
              instructions: 'Walk north on Main St.',
              start_location: new google.maps.LatLng(45.5017, -73.5673),
              distance: { text: '200 m', value: 200 },
              duration: { text: '2 mins', value: 2 },
              transit_details: undefined
            },
          ],
          eta: '6 mins',
        };
      }
      resolve(response);
    }, 100);
  });
}

describe('DirectionsComponent', () => {
  let component: DirectionsComponent;
  let fixture: ComponentFixture<DirectionsComponent>;

  beforeAll(() => {
    console.log('Running DirectionsComponent tests');
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), DirectionsComponent] // Moved DirectionsComponent to imports
    }).compileComponents();

    fixture = TestBed.createComponent(DirectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with WALKING mode', () => {
    expect(component.selectedMode).toBe('WALKING');
  });

  it('should set mode correctly', () => {
    component.setMode('DRIVING');
    expect(component.selectedMode).toBe('DRIVING');
  });

  it('should load directions and update steps and eta', async () => {
    spyOn(component, 'loadDirections').and.callFake(async (mode: string) => await mockCalculateRoute(mode));
    component.setMode('WALKING');
    await fixture.whenStable();
    expect(component.steps.length).toBeGreaterThan(0);
    expect(component.eta).toBe('6 mins');
  });

  it('should handle API errors gracefully', async () => {
    spyOn(component, 'loadDirections').and.callFake(async () => { throw new Error('API Error'); });
    component.setMode('TRANSIT');
    await fixture.whenStable();
    expect(component.isLoading).toBeFalse();
  });
});
