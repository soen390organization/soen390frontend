import { of } from 'rxjs';
import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { GoogleSignInComponent } from './google-signin.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('MapSearchComponent', () => {
  let component: GoogleSignInComponent;
  let fixture: ComponentFixture<GoogleSignInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        BrowserAnimationsModule, // Needed if testing animations
        GoogleSignInComponent
      ],
      providers: []
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleSignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
