import { Injectable } from '@angular/core';
import { PlacesService } from './places.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapService {
  private map!: google.maps.Map;

  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;

  constructor(private placesService: PlacesService) {}

  initialize(map: google.maps.Map) {
    this.map = map;
    this.placesService.initialize(this.map);
  }

  getMap(): google.maps.Map {
    return this.map;
  }

  updateMapLocation(location: google.maps.LatLng) {
    if (this.map) {
      this.map.setCenter(location);
      this.map.setZoom(18);
    }
  }

  // Add params for walk, drive, bus
  calculateRoute(startAddress: string, destinationAddress: string) {
    if (!this.directionsService)
      this.directionsService = new google.maps.DirectionsService();
    if (!this.directionsRenderer)
      this.directionsRenderer = new google.maps.DirectionsRenderer();

    // Bind the directions display to the given map
    this.directionsRenderer.setMap(this.map);

    const request: google.maps.DirectionsRequest = {
      origin: startAddress,
      destination: destinationAddress,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    this.directionsService.route(request, (response, status) => {
      if (status === 'OK' && response) {
        this.directionsRenderer.setDirections(response);
      } else {
        console.error('Directions request failed due to ', status);
      }
    });
  }
}
