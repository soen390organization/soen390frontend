import { Component } from '@angular/core';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { ViewChild } from '@angular/core';
import { CurrentLocationService } from '../services/geolocation/current-location.service'
import { environment } from 'src/environments/environment';
import { GoogleMapService } from '../services/googeMap.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  startMarker: google.maps.Marker | null = null;
  startLocation: string = '';

  constructor(private googleMapService: GoogleMapService) {}

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
    if (searchTerm.length == 0) {
      return; // Exit if the search term is empty
    }
    this.startLocation = searchTerm;
    const request = {
        query: searchTerm,
        fields: ['geometry'], // Request geometry to get location coordinates
    };
    const placesService = new google.maps.places.PlacesService(this.googleMapService.getMap());

    placesService.findPlaceFromQuery(request, (results: any, status: any) => {
        console.log(status);
        console.log(results);
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            const place = results[0];

            if (place.geometry && place.geometry.location) {
                // Update map location
                this.googleMapService.updateMapLocation(place.geometry.location);

                // ========== ADD BLUE DOT MARKER ==========
                const blueDotIcon = {
                    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg', // Google Maps built-in blue dot icon
                    scaledSize: new google.maps.Size(40, 40) // Adjust size if needed
                };

                if (!this.startMarker) {
                    // Create a new marker if it doesn't exist
                    this.startMarker = new google.maps.Marker({
                        position: place.geometry.location,
                        map: this.googleMapService.getMap(), // Attach marker to the map
                        icon: blueDotIcon // Use blue dot icon
                    });
                } else {
                    // Update existing marker position
                    this.startMarker.setPosition(place.geometry.location);
                    this.startMarker.setIcon(blueDotIcon); // Ensure marker remains a blue dot
                }
            }
        }
    });
      });
    }).catch(error => {
      console.error("Error getting location:", error);
    });
  }
}
