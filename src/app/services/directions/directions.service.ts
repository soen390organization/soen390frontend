import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Step } from '../../interfaces/step.interface';

export interface Location {
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

  private startPoint$ = new BehaviorSubject<Location | null>(null);
  private destinationPoint$ = new BehaviorSubject<Location | null>(null);

  private allRoutesData: {
      mode: google.maps.TravelMode;
      eta: string | null;
      distance: number;
      duration: number;
  }[] = [];

  private shortestRoute: {
    mode: google.maps.TravelMode;
    eta: string | null;
    distance: number;
    duration: number;
  } | null = null;


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

  getStartPoint(): Observable<Location | null> {
    return this.startPoint$.asObservable();
  }

  getDestinationPoint(): Observable<Location | null> {
    return this.destinationPoint$.asObservable();
  }

  setStartPoint(location: Location): void {
    const marker = this.startPoint$.value?.marker ?? new google.maps.Marker({
      position: location.coordinates,
      map: this.directionsRenderer.getMap(),
      icon: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg',
        scaledSize: new google.maps.Size(40, 40)
      }
    });

    marker.setPosition(location.coordinates);

    this.startPoint$.next({ ...location, marker });
    this.updateMapView("start");
  }

  getShortestRoute(): { eta: string | null; distance: number } | null {
    if (!this.shortestRoute) return null;
    return {
      eta: this.shortestRoute.eta,
      distance: this.shortestRoute.distance,
    };
  }

  setDestinationPoint(location: Location): void {
    const marker = this.destinationPoint$.value?.marker ?? new google.maps.Marker({
      position: location.coordinates,
      map: this.directionsRenderer.getMap(),
      icon: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg',
        scaledSize: new google.maps.Size(40, 40)
      }
    });

    marker.setPosition(location.coordinates);

    this.destinationPoint$.next({ ...location, marker });
    this.updateMapView("destination");
  }

  get hasBothPoints$(): Observable<boolean> {
    return combineLatest([this.startPoint$, this.destinationPoint$]).pipe(
      map(([start, destination]) => !!start && !!destination)
    );
  }

  // Function to handle the button click, which will enable the start functionality
  showDirections(): void {
    this.updateMapView("both");
  }

  private updateMapView(toUpdate: string) {
    const map = this.directionsRenderer.getMap();

    const startPoint = this.startPoint$.value;
    const destinationPoint = this.destinationPoint$.value;

    if (toUpdate=="both") {
      this.calculateRoute(startPoint.address, destinationPoint.address, google.maps.TravelMode.WALKING, true);
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startPoint.marker.getPosition()!);
      bounds.extend(destinationPoint.marker.getPosition()!);
      map.fitBounds(bounds);
    } else {
      this.directionsRenderer.set('directions', null);
      const point = toUpdate == "start" ? startPoint : destinationPoint;
      if (point) {
        map.setCenter(point.marker.getPosition()!);
        map.setZoom(18);
      }
    }
  }

  /**
   * Converts a string (e.g., "WALKING") into a google.maps.TravelMode enum.
   */
  getTravelMode(mode: string): google.maps.TravelMode {
    switch (mode.toUpperCase()) {
      case 'WALKING':
        return google.maps.TravelMode.WALKING;
      case 'TRANSIT':
        return google.maps.TravelMode.TRANSIT;
      case 'DRIVING':
        return google.maps.TravelMode.DRIVING;
      case 'BICYCLING':
        return google.maps.TravelMode.BICYCLING;
      default:
        console.warn(`Invalid travel mode: ${mode}, defaulting to WALKING`);
        return google.maps.TravelMode.WALKING;
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
    startAddress: string|google.maps.LatLng,
    destinationAddress: string|google.maps.LatLng,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING,
    render: boolean = true
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
          if (render) {
            this.directionsRenderer.setDirections(response);

          }
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
                  end_location: step.end_location,
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

  public async calculateShortestRoute(
    start: string | google.maps.LatLng,
    destination: string | google.maps.LatLng
  ): Promise<void> {
    const modes = [
      google.maps.TravelMode.DRIVING,
      google.maps.TravelMode.WALKING,
      google.maps.TravelMode.BICYCLING,
      google.maps.TravelMode.TRANSIT,
    ];

    // Calculate routes for each mode in parallel.
    const results = await Promise.all(
      modes.map(async (mode) => {
        const { steps, eta } = await this.calculateRoute(start, destination, mode, false);
        const { totalDistance, totalDuration } = (steps ?? []).reduce(
          (acc, step) => ({
            totalDistance: acc.totalDistance + (step.distance?.value ?? 0),
            totalDuration: acc.totalDuration + (step.duration?.value ?? 0),
          }),
          { totalDistance: 0, totalDuration: 0 }
        );

        return { mode, eta, distance: totalDistance, duration: totalDuration };
      })
    );

    // Find the route with the smallest duration.
    this.shortestRoute = results.reduce((fastest, route) =>
      route.duration < fastest.duration ? route : fastest
    );

    this.allRoutesData = results;

    await this.calculateRoute(start, destination, this.shortestRoute.mode, false);
  }

  clearStartPoint(): void {
    if (this.startPoint$.value?.marker) {
      this.startPoint$.value.marker.setMap(null);
    }
    this.startPoint$.next(null);
    this.updateMapView("start");
  }

  clearDestinationPoint(): void {
    if (this.destinationPoint$.value?.marker) {
      this.destinationPoint$.value.marker.setMap(null);
    }
    this.destinationPoint$.next(null);
    this.updateMapView("destination");
  }

}
