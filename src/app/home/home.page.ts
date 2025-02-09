import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { loadUser, UserState } from '../store/user';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { UserInterface } from '../interfaces/user.interface';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { DirectionsComponent } from '../components/directions/directions.component';
import { GoogleMapService } from '../services/googeMap.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements AfterViewInit {
  @ViewChild(GoogleMapComponent) googleMapComp!: GoogleMapComponent;
  @ViewChild(DirectionsComponent) directionsComp!: DirectionsComponent;

  user$: Observable<UserState> = this.store.pipe(select('user'));
  email: string = '';
  password: string = '';


  constructor(
    private readonly store: Store<{ user: UserState }>,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly googleMapService: GoogleMapService
  ) {}

  ngOnInit() {
    this.store.dispatch(loadUser());
  }
  //map not working after merging, says component undefined in map component
  ngAfterViewInit() {
    const startAddress = '7141 Rue Sherbrooke O Montréal, QC H4B 2A7 Canada';
    const destinationAddress = '1515 Saint-Catherine St W #1428 Montreal, Quebec H3G 1S6 Canada';

    const checkMap = setInterval(() => {
      if (this.googleMapService.getMap()) {
        clearInterval(checkMap);
        this.directionsComp.calculateRoute(
          this.googleMapService.getMap(),
          startAddress,
          destinationAddress
        );
      }
    }, 500);
  }



  onLogin(event: Event) {
    event.preventDefault(); // Prevent form submission
    this.authService
      .login(this.email, this.password)
      .then((userCredential) => {
        console.log('Login successful:', userCredential);
        // Handle successful login (e.g., navigate to a different page)
      })
      .catch((error) => {
        console.error('Login failed:', error.message);
        // Handle login error (e.g., show an error message)
      });
  }

  onSignup(event: Event) {
    event.preventDefault(); // Prevent form submission
    this.authService
      .signup(this.email, this.password)
      .then((userCredential) => {
        console.log('Signup successful:', userCredential);
        // Handle successful signup (e.g., navigate or show success message)
      })
      .catch((error) => {
        console.error('Signup failed:', error.message);
        // Handle signup error (e.g., show an error message)
      });
  }
}
