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
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.map = this.googleMapService.getMap();
    this.directionsRenderer.setMap(this.map);
  }

  getDirectionsService(): google.maps.DirectionsService {
    return this.directionsService;
  }

  getDirectionsRenderer(): google.maps.DirectionsRenderer {
    return this.directionsRenderer;
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
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING
  ): Promise<{
    steps: Partial<google.maps.DirectionsStep>[];
    eta: string | null;
  }> {
    return new Promise((resolve, reject) => {
      this.directionsRenderer.setMap(this.map);

      this.setRouteColor(travelMode);

      const request: google.maps.DirectionsRequest = {
        origin: startAddress,
        destination: destinationAddress,
        travelMode: travelMode,
      };

      this.directionsService.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          this.directionsRenderer.setDirections(response);

          const steps: Partial<google.maps.DirectionsStep>[] = [];
          let eta: string | null = null;

          if (response.routes.length > 0) {
            const route = response.routes[0];

            if (route.legs.length > 0) {
              const leg = route.legs[0];
              eta = leg.duration?.text || null;

              leg.steps.forEach((step) => {
                steps.push({
                  instructions: step.instructions, // "Turn right onto Main St."
                  start_location: step.start_location,
                  distance: step.distance,
                  duration: step.duration,
                  transit_details: step.transit_details,
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

  setRouteColor(travelMode: google.maps.TravelMode) {
    const walkingLineSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 1,
      scale: 3,
    };

    switch (travelMode) {
      case google.maps.TravelMode.DRIVING:
        this.directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: 'red',
          },
        });
        break;
      case google.maps.TravelMode.TRANSIT:
        this.directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: 'green',
          },
        });
        break;
      case google.maps.TravelMode.WALKING:
        this.directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: '#0096FF',
            strokeOpacity: 0,
            icons: [
              {
                icon: walkingLineSymbol,
                offset: '0',
                repeat: '10px',
              },
            ],
          },
        });
    }
  }
}
