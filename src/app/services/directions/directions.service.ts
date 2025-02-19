import { Injectable } from '@angular/core';
import { Step } from '../../interfaces/step.interface';

interface Location {
  title: string;
  address: string;
  coordinates: google.maps.LatLng;
  image?: string;
  marker?: google.maps.Marker;
}

@Injectable({
  providedIn: 'root',
})
export class DirectionsService {
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;
  private startPoint?: Location;
  private destinationPoint?: Location;

  constructor() {}

  public initialize(map: google.maps.Map): void {
    if (!this.directionsService)
      this.directionsService = new google.maps.DirectionsService();
    if (!this.directionsRenderer) {
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(map);
    }
  }

  getDirectionsService(): google.maps.DirectionsService {
    return this.directionsService;
  }

  getDirectionsRenderer(): google.maps.DirectionsRenderer {
    return this.directionsRenderer;
  }

  getStartPoint(): Location | null {
    return this.startPoint;
  }
  
  setStartPoint(location: Location): void {
    const marker = this.startPoint?.marker ?? new google.maps.Marker({
      position: location.coordinates,
      map: this.directionsRenderer.getMap(),
      icon: { 
        url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg', 
        scaledSize: new google.maps.Size(40, 40) 
      }
    });
  
    marker.setPosition(location.coordinates);

    this.startPoint = { ...location, marker };
    this.updateMapView();
  }
  
  setDestinationPoint(location: Location): void {
    const marker = this.destinationPoint?.marker ?? new google.maps.Marker({
      position: location.coordinates,
      map: this.directionsRenderer.getMap(),
      icon: { 
        url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg', 
        scaledSize: new google.maps.Size(40, 40) 
      }
    });
  
    marker.setPosition(location.coordinates);

    this.destinationPoint = { ...location, marker };
    this.updateMapView();
  }

  private updateMapView() {
    const map = this.directionsRenderer.getMap();
  
    const { startPoint, destinationPoint } = this;
  
    if (startPoint && destinationPoint) {
      this.calculateRoute(this.startPoint.address, this.destinationPoint.address, google.maps.TravelMode.WALKING);
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startPoint.marker.getPosition()!);
      bounds.extend(destinationPoint.marker.getPosition()!);
      map.fitBounds(bounds);
    } else {
      const point = startPoint ?? destinationPoint;
      if (point) {
        map.setCenter(point.marker.getPosition()!);
        map.setZoom(18);
      }
    }
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
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING,
  ): Promise<{
    steps: Step[];
    eta: string | null;
  }> {
    return new Promise((resolve, reject) => {
      // this.directionsRenderer.setMap(this.map);

      this.setRouteColor(travelMode);

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
    const polylineOptions: google.maps.PolylineOptions = {};

    switch (travelMode) {
      case google.maps.TravelMode.DRIVING:
        polylineOptions['strokeColor'] = 'red';
        break;
      case google.maps.TravelMode.TRANSIT:
        polylineOptions['strokeColor'] = 'green';
        break;
      case google.maps.TravelMode.WALKING:
        polylineOptions['strokeColor'] = '#0096FF';
        polylineOptions['strokeOpacity'] = 0;
        polylineOptions['icons'] = [
          {
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillOpacity: 1,
              scale: 3,
            },
            offset: '0',
            repeat: '10px',
          },
        ];
    }
    this.directionsRenderer.setOptions({ polylineOptions });
    return polylineOptions;
  }
}
