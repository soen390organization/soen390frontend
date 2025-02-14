import { Component, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { DirectionsService } from 'src/app/services/directions.service';

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
  startLocationInput = '';
  startLocation:
    | {
        address: string;
        coordinates: google.maps.LatLng;
        marker: google.maps.Marker;
      }
    | undefined;
  destinationLocationInput = '';
  destinationLocation:
    | {
        address: string;
        coordinates: google.maps.LatLng;
        marker: google.maps.Marker;
      }
    | undefined;
  isSearchVisible = false;

  constructor(
    private googleMapService: GoogleMapService,
    private directionsService: DirectionsService
  ) {}

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
  }

  onSetUsersLocationAsStart() {
    const currentLocationService = new CurrentLocationService();
    currentLocationService.getCurrentLocation().then((position) => {
      if (position == null) throw new Error('Current location is null.');

      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ location: position }, (results, status) => {
        if (results == null)
          throw new Error("Current location's address cannot be read.");

        const result = results[0];
        this.startLocation = {
          address: result.formatted_address,
          coordinates: result.geometry.location,
          marker:
            this.startLocation?.marker ??
            this.googleMapService.createMarker(
              result.geometry.location,
              'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg'
            ),
        };
        this.startLocation.marker.setPosition(result.geometry.location);
        this.startLocationInput = 'Your Location';
        this.updateMapView();
      });
    });
  }

  async onSearchChangeStart(event: any) {
    const searchTerm = event.target.value;
    if (!searchTerm) {
      return;
    }

    const result = await this.findPlace(searchTerm);

    this.startLocation = {
      address: result.formatted_address,
      coordinates: result.geometry.location,
      marker:
        this.startLocation?.marker ??
        this.googleMapService.createMarker(
          result.geometry.location,
          'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg'
        ),
    };
    this.startLocation.marker.setPosition(result.geometry.location);

    if (this.destinationLocation)
      this.directionsService.calculateRoute(
        this.startLocation.address,
        this.destinationLocation.address
      );

    this.updateMapView();
  }

  async onSearchChangeDestination(event: any) {
    const searchTerm = event.target.value;
    if (!searchTerm) {
      return;
    }

    const result = await this.findPlace(searchTerm);
    this.destinationLocation = {
      address: result.formatted_address,
      coordinates: result.geometry.location,
      marker:
        this.destinationLocation?.marker ??
        this.googleMapService.createMarker(
          result.geometry.location,
          'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg'
        ),
    };
    this.destinationLocation.marker.setPosition(result.geometry.location);

    if (this.startLocation)
      this.directionsService.calculateRoute(
        this.startLocation.address,
        this.destinationLocation.address
      );

    this.updateMapView();
  }

  findPlace(searchTerm: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        query: searchTerm,
        fields: ['geometry', 'formatted_address'],
      };

      const placesService = new google.maps.places.PlacesService(
        this.googleMapService.getMap()
      );

      placesService.findPlaceFromQuery(request, (results: any, status: any) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results.length > 0
        ) {
          resolve(results[0]);
        } else {
          reject(null);
        }
      });
    });
  }

  // To be moved to google map service


  updateMapView() {
    const map = this.googleMapService.getMap();
    if (this.startLocation && this.destinationLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(this.startLocation?.marker.getPosition()!);
      bounds.extend(this.destinationLocation?.marker.getPosition()!);
      map.fitBounds(bounds);
    } else if (this.startLocation) {
      map.setCenter(this.startLocation?.marker.getPosition()!);
      map.setZoom(15);
    } else if (this.destinationLocation) {
      map.setCenter(this.destinationLocation?.marker.getPosition()!);
      map.setZoom(15);
    }
  }
}
