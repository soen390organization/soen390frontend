import { Injectable } from '@angular/core';
import { GoogleMapService } from './googeMap.service';

@Injectable({
  providedIn: 'root',
})
export class DirectionsService {
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;
  private map!: google.maps.Map;

  constructor(private googleMapService: GoogleMapService) {
    this.initializeServices();
  }

  private async initializeServices() {
    await this.googleMapService.waitForApiLoad();
    this.directionsService = this.googleMapService.getDirectionsService();
    this.directionsRenderer = this.googleMapService.getDirectionsRenderer();
    this.map = this.googleMapService.getMap();
  }

  calculateRoute(
    startAddress: string,
    destinationAddress: string,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING
  ) {
    if (!this.directionsService || !this.directionsRenderer) {
      console.error(
        'DirectionsService or DirectionsRenderer is not initialized yet.'
      );
      return;
    }

    if (!this.map) {
      console.error('Google Map is not initialized.');
      return;
    }

    this.directionsRenderer.setMap(this.map);

    const request: google.maps.DirectionsRequest = {
      origin: startAddress,
      destination: destinationAddress,
      travelMode: travelMode,
    };

    this.directionsService.route(request, (response, status) => {
      if (status === google.maps.DirectionsStatus.OK && response) {
        this.directionsRenderer.setDirections(response);
      } else {
        console.error('Directions request failed due to', status);
      }
    });
  }
}
