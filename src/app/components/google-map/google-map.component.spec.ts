import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { GoogleMapComponent } from './google-map.component';
import { provideMockStore } from '@ngrx/store/testing';

describe('GoogleMapComponent', () => {
  let component: GoogleMapComponent;
  let fixture: ComponentFixture<GoogleMapComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GoogleMapComponent],
      providers: [
        // Provide a mock store to satisfy any service that depends on 'Store'
        provideMockStore({ initialState: {} })
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers lifecycle hooks
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
