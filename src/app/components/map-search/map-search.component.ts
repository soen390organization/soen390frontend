import { Component, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { environment } from 'src/environments/environment';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-map-search',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './map-search.component.html',
  styleUrls: ['./map-search.component.scss'],
  animations: [
    trigger('slideInOut', [
      state(
        'in',
        style({
          width: '360px',
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      state(
        'out',
        style({
          width: '0px',
          opacity: 0,
          transform: 'translateX(-100%)',
        })
      ),
      transition('out => in', animate('0.15s ease-in-out')),
      transition('in => out', animate('0.15s ease-in-out')),
    ]),
  ],
})
export class MapSearchComponent {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
  // @ts-ignore: Suppress deprecated warning temporarily
  startMarker: google.maps.Marker | null = null;
  // @ts-ignore: Suppress deprecated warning temporarily
  destinationMarker: google.maps.Marker | null = null;
  isSearchVisible = false; // Initially the search input is hidden
  startLocationInput = '';
  destinationLocationInput = '';

  constructor(private googleMapService: GoogleMapService) {}

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
  }

  onSetUsersLocationAsStart() {
    this.startLocationInput = 'Your Location';
    let ser = new CurrentLocationService();
    let currentLat = 0;
    let currentLng = 0;
    let searchTerm = '';
    ser
      .getCurrentLocation()
      .then((value) => {
        if (value == null) {
          throw new Error('Current location is null.');
        }
        currentLat = value.lat;
        currentLng = value.lng;
        console.log(value.lat);
        console.log(value.lng);

        let geocoder = new google.maps.Geocoder();
        let latlng = { lat: currentLat, lng: currentLng };
        geocoder.geocode({ location: latlng }, (results, status) => {
          console.log(status);
          console.log(environment.firebaseConfig.apiKey);
          if (results == null) {
            throw new Error("Current location's address cannot be read.");
          }
          searchTerm = results[0].formatted_address;
          if (searchTerm.length === 0) {
            return; // Exit if the search term is empty
          }
          const request = {
            query: searchTerm,
            fields: ['geometry'], // Request geometry to get location coordinates
          };
          const placesService = new google.maps.places.PlacesService(
            this.googleMapService.getMap()
          );

          placesService.findPlaceFromQuery(
            request,
            (results: any, status: any) => {
              console.log(status);
              console.log(results);
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                results.length > 0
              ) {
                const place = results[0];

                if (place.geometry && place.geometry.location) {
                  // Update map location
                  this.googleMapService.updateMapLocation(
                    place.geometry.location
                  );

                  // ========== ADD BLUE DOT MARKER ==========
                  const blueDotIcon = {
                    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg',
                    scaledSize: new google.maps.Size(40, 40),
                  };

                  if (!this.startMarker) {
                    this.startMarker = new google.maps.Marker({
                      position: place.geometry.location,
                      map: this.googleMapService.getMap(),
                      icon: blueDotIcon,
                    });
                  } else {
                    this.startMarker.setPosition(place.geometry.location);
                    this.startMarker.setIcon(blueDotIcon);
                  }
                  this.updateMapView();
                }
              }
            }
          );
        });
      })
      .catch((error) => {
        console.error('Error getting location:', error);
      });
  }

  onSearchChangeStart(event: any) {
    // Only search if the input value is not empty.
    if (!event.target?.value) {
      return;
    }
    this.onSearch(
      event,
      'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg'
    );
  }

  onSearchChangeDestination(event: any) {
    // Only search if the input value is not empty.
    if (!event.target?.value) {
      return;
    }
    this.onSearch(
      event,
      'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg'
    );
  }

  onSearch(event: any, iconUrl: string) {
    const searchTerm = (event.target as HTMLInputElement).value;
    if (!searchTerm) return; // Exit if the search term is empty

    const request = {
      query: searchTerm,
      fields: ['geometry'],
    };

    const placesService = new google.maps.places.PlacesService(
      this.googleMapService.getMap()
    );

    placesService.findPlaceFromQuery(request, (results: any, status: any) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        results.length > 0
      ) {
        const place = results[0];

        if (place.geometry && place.geometry.location) {
          // Update map location
          this.googleMapService.updateMapLocation(place.geometry.location);

          // ========== ADD/UPDATE MARKER ==========
          const markerIcon = {
            url: iconUrl,
            scaledSize: new google.maps.Size(40, 40),
          };

          if (iconUrl.includes('Icone_Verde.svg')) {
            if (!this.startMarker) {
              this.startMarker = new google.maps.Marker({
                position: place.geometry.location,
                map: this.googleMapService.getMap(),
                icon: markerIcon,
              });
            } else {
              this.startMarker.setPosition(place.geometry.location);
              this.startMarker.setIcon(markerIcon);
            }
          } else if (iconUrl.includes('Icone_Vermelho.svg')) {
            if (!this.destinationMarker) {
              this.destinationMarker = new google.maps.Marker({
                position: place.geometry.location,
                map: this.googleMapService.getMap(),
                icon: markerIcon,
              });
            } else {
              this.destinationMarker.setPosition(place.geometry.location);
              this.destinationMarker.setIcon(markerIcon);
            }
          }
          this.updateMapView();
        }
      }
    });
  }

  updateMapView() {
    const map = this.googleMapService.getMap();
    if (this.startMarker && this.destinationMarker) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(this.startMarker.getPosition()!);
      bounds.extend(this.destinationMarker.getPosition()!);
      map.fitBounds(bounds);
    } else if (this.startMarker) {
      map.setCenter(this.startMarker.getPosition()!);
      map.setZoom(15);
    } else if (this.destinationMarker) {
      map.setCenter(this.destinationMarker.getPosition()!);
      map.setZoom(15);
    }
  }
}
