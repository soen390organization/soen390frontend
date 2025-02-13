import { Injectable } from '@angular/core';
import { GoogleMapService } from './googeMap.service';
import { Step } from '../interfaces/step.interface';

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

  /**
   *
   * @param startAddress
   * @param destinationAddress
   * @param travelMode
   * @returns
   *
   * steps: {
      instruction: string;
      location: google.maps.LatLng;
      distance?: {
        text: string;
        value: number (in meters);
      };
      duration?: {
        text: string;
        value: number (in minutes);
      };
    }[];
    eta: string
   */
  calculateRoute(
    startAddress: string,
    destinationAddress: string,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<{
    steps: Step[];
    eta: string | null;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.directionsService || !this.directionsRenderer) {
        reject('Google Maps services are not ready.');
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

          const steps: Step[] = [];
          let eta: string | null = null;

          if (response.routes.length > 0) {
            const route = response.routes[0];

            if (route.legs.length > 0) {
              const leg = route.legs[0];
              eta = leg.duration?.text || null;

              leg.steps.forEach((step) => {
                steps.push({
                  instruction: step.instructions, // "Turn right onto Main St."
                  location: step.start_location, // Google Maps LatLng object
                  distance: step.distance,
                  duration: step.duration,
                });
              });
            }
          }

          resolve({ steps, eta });
        } else {
          reject(status);
        }
      });
    });
  }
}
