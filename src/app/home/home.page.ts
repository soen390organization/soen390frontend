import { Component } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { loadUser, UserState } from '../store/user';
import { AuthService } from '../services/auth.service';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { UserService } from '../services/user.service';
import { UserInterface } from '../interfaces/user.interface';
import { ViewChild } from '@angular/core';
import { CurrentLocationService } from '../services/current-location.service'
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent; 
  startMarker: google.maps.Marker | null = null;
  destinationMarker: google.maps.Marker | null = null;

  user$: Observable<UserState> = this.store.pipe(select('user'));
  email: string = '';
  password: string = '';

  constructor(
    private store: Store<{ user: UserState }>,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.store.dispatch(loadUser());
  }

  handleUserTest() {
    // this.userService.updateOrCreateUser('yanny@laurel.com');
    const user: UserInterface = {
      firstName: 'Noura',
      lastName: 'Tabbara',
      email: 'tabby@gmail.com',
      password: 'fatberry'
    }
    this.userService.createUser(user).then((userData) => console.log(userData));
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
  onSearchChangeStart(event: any) {
    const searchTerm = event.detail.value;
    if (!searchTerm) return; // Exit if the search term is empty

    const request = {
        query: searchTerm,
        fields: ['geometry'], // Request geometry to get location coordinates
    };

    const placesService = new google.maps.places.PlacesService(this.googleMap.map);

    placesService.findPlaceFromQuery(request, (results: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            const place = results[0];

            if (place.geometry && place.geometry.location) {
                // Update map location
                this.googleMap.updateMapLocation(place.geometry.location);

                // ========== ADD BLUE DOT MARKER ==========
                const blueDotIcon = {
                    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg', // Google Maps built-in blue dot icon
                    scaledSize: new google.maps.Size(40, 40) // Adjust size if needed
                };

                if (!this.startMarker) {
                    // Create a new marker if it doesn't exist
                    this.startMarker = new google.maps.Marker({
                        position: place.geometry.location,
                        map: this.googleMap.map, // Attach marker to the map
                        icon: blueDotIcon // Use blue dot icon
                    });
                } else {
                    // Update existing marker position
                    this.startMarker.setPosition(place.geometry.location);
                    this.startMarker.setIcon(blueDotIcon); // Ensure marker remains a blue dot
                }
                // =========================================
            }
        }
    });
}

onSearchChangeStartToCurrentLocation(event: any) {
    let ser = new CurrentLocationService();
    let currentLat = 0;
    let currentLng = 0;
    let searchTerm = "";
    ser.getCurrentLocation().then(value => {
      if (value == null) {
        throw new Error("Current location is null.")
      }
      currentLat = value.lat;
      currentLng = value.lng;
      console.log(value.lat);
      console.log(value.lng);

      let geocoder = new google.maps.Geocoder;
      let latlng = {lat: currentLat, lng: currentLng};
      geocoder.geocode({'location': latlng}, (results, status) => {
        console.log(status);
        console.log(environment.firebaseConfig.apiKey);
        if (results == null) {
          throw new Error("Current location's address cannot be read.")
        }
        searchTerm = results[0].formatted_address;
      });
    }).catch(error => {
      console.error("Error getting location:", error);
    });
    console.log(searchTerm);
    if (!searchTerm) return; // Exit if the search term is empty

    const request = {
        query: searchTerm,
        fields: ['geometry'], // Request geometry to get location coordinates
    };

    const placesService = new google.maps.places.PlacesService(this.googleMap.map);

    placesService.findPlaceFromQuery(request, (results: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            const place = results[0];

            if (place.geometry && place.geometry.location) {
                // Update map location
                this.googleMap.updateMapLocation(place.geometry.location);

                // ========== ADD BLUE DOT MARKER ==========
                const blueDotIcon = {
                    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg', // Google Maps built-in blue dot icon
                    scaledSize: new google.maps.Size(40, 40) // Adjust size if needed
                };

                if (!this.startMarker) {
                    // Create a new marker if it doesn't exist
                    this.startMarker = new google.maps.Marker({
                        position: place.geometry.location,
                        map: this.googleMap.map, // Attach marker to the map
                        icon: blueDotIcon // Use blue dot icon
                    });
                } else {
                    // Update existing marker position
                    this.startMarker.setPosition(place.geometry.location);
                    this.startMarker.setIcon(blueDotIcon); // Ensure marker remains a blue dot
                }
                // =========================================
            }
        }
    });
}

onSearchChangeDestination(event: any) {
  const searchTerm = event.detail.value;
  if (!searchTerm) return; // Exit if the search term is empty

  const request = {
      query: searchTerm,
      fields: ['geometry'], // Request geometry to get location coordinates
  };

  const placesService = new google.maps.places.PlacesService(this.googleMap.map);

  placesService.findPlaceFromQuery(request, (results: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
          const place = results[0];

          if (place.geometry && place.geometry.location) {
              // Update map location
              this.googleMap.updateMapLocation(place.geometry.location);

              // ========== ADD BLUE DOT MARKER ==========
              const blueDotIcon = {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg', // Google Maps built-in blue dot icon
                  scaledSize: new google.maps.Size(40, 40) // Adjust size if needed
              };

              if (!this.destinationMarker) {
                  // Create a new marker if it doesn't exist
                  this.destinationMarker = new google.maps.Marker({
                      position: place.geometry.location,
                      map: this.googleMap.map, // Attach marker to the map
                      icon: blueDotIcon // Use blue dot icon
                  });
              } else {
                  // Update existing marker position
                  this.destinationMarker.setPosition(place.geometry.location);
                  this.destinationMarker.setIcon(blueDotIcon); // Ensure marker remains a blue dot
              }
              // =========================================
          }
      }
  });
}
}
