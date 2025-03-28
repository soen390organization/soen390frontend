import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Step } from '../../interfaces/step.interface';
import { ShuttleService } from '../shuttle/shuttle.service';
import { Location } from 'src/app/interfaces/location.interface';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

@Injectable({
  providedIn: 'root'
})
export class DirectionsService {
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;

  private startPoint$ = new BehaviorSubject<GoogleMapLocation | null>(null);
  private destinationPoint$ = new BehaviorSubject<GoogleMapLocation | null>(null);

  private shortestRoute: {
    mode: string;
    eta: string | null;
    distance: number;
    duration: number;
  } | null = null;

  constructor(private readonly shuttleService: ShuttleService) {}

  public initialize(map: google.maps.Map): void {
    if (!this.directionsService) this.directionsService = new google.maps.DirectionsService();
    if (!this.directionsRenderer) {
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(map);
    }
    this.shuttleService.initialize(map);
  }

  getDirectionsService(): google.maps.DirectionsService {
    return this.directionsService;
  }

  getDirectionsRenderer(): google.maps.DirectionsRenderer {
    return this.directionsRenderer;
  }

  getStartPoint(): Observable<GoogleMapLocation | null> {
    return this.startPoint$.asObservable();
  }

  getDestinationPoint(): Observable<GoogleMapLocation | null> {
    return this.destinationPoint$.asObservable();
  }

  setStartPoint(location: GoogleMapLocation): void {
    const marker =
      this.startPoint$.value?.marker ??
      new google.maps.Marker({
        position: location.coordinates,
        map: this.directionsRenderer.getMap(),
        icon: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg',
          scaledSize: new google.maps.Size(40, 40)
        }
      });

    marker.setPosition(location.coordinates);

    this.startPoint$.next({ ...location, marker });
    this.updateMapView();
  }

  getShortestRoute(): { eta: string | null; distance: number; mode: string } | null {
    if (!this.shortestRoute) return null;
    return {
      eta: this.shortestRoute.eta,
      distance: this.shortestRoute.distance,
      mode: this.shortestRoute.mode
    };
  }

  setDestinationPoint(location: GoogleMapLocation): void {
    const marker =
      this.destinationPoint$.value?.marker ??
      new google.maps.Marker({
        position: location.coordinates,
        map: this.directionsRenderer.getMap(),
        icon: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg',
          scaledSize: new google.maps.Size(40, 40)
        }
      });

    marker.setPosition(location.coordinates);

    this.destinationPoint$.next({ ...location, marker });
    this.updateMapView();
  }

  get hasBothPoints$(): Observable<boolean> {
    return combineLatest([this.startPoint$, this.destinationPoint$]).pipe(
      map(([start, destination]) => !!start && !!destination)
    );
  }

  // Function to handle the button click, which will enable the start functionality
  showDirections(): void {
    this.updateMapView();
  }

  private updateMapView() {
    const map = this.directionsRenderer.getMap();

    const startPoint = this.startPoint$.value;
    const destinationPoint = this.destinationPoint$.value;

    if (startPoint && destinationPoint) {
      this.calculateRoute(
        startPoint.address,
        destinationPoint.address,
        google.maps.TravelMode.WALKING,
        true
      );
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startPoint.marker.getPosition()!);
      bounds.extend(destinationPoint.marker.getPosition()!);
      map.fitBounds(bounds);
    } else {
      this.directionsRenderer.set('directions', null);
      const point = startPoint ?? destinationPoint;
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
  async calculateRoute(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING,
    render: boolean = false,
    renderer: google.maps.DirectionsRenderer = this.directionsRenderer
  ): Promise<{
    steps: Step[];
    eta: string | null;
  }> {
    return new Promise((resolve, reject) => {
      this.setRouteColor(travelMode, renderer);

      const request: google.maps.DirectionsRequest = {
        origin: startAddress,
        destination: destinationAddress,
        travelMode: travelMode
      };
      this.directionsService.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          if (render) {
            renderer.setDirections(response);
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
                  transit_details: step.transit_details
                });
              });
            }
          }

          resolve({ steps, eta });
        } else {
          reject(Error(status));
        }
      });
    });
  }

  async generateRoute(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng,
    travelMode: string | google.maps.TravelMode = google.maps.TravelMode.WALKING
  ) {
    this.shuttleService.clearMapDirections();
    if (travelMode === 'SHUTTLE') {
      return this.shuttleService.calculateShuttleBusRoute(startAddress, destinationAddress, true);
    } else {
      return await this.calculateRoute(
        startAddress,
        destinationAddress,
        this.getTravelMode(travelMode),
        true
      );
    }
  }

  setRouteColor(
    travelMode: google.maps.TravelMode | string,
    renderer: google.maps.DirectionsRenderer
  ): google.maps.PolylineOptions {
    const polylineOptions: google.maps.PolylineOptions = {};

    switch (travelMode) {
      case 'SHUTTLE':
        polylineOptions['strokeColor'] = 'purple';
        break;
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
              scale: 3
            },
            offset: '0',
            repeat: '10px'
          }
        ];
    }
    renderer.setOptions({ polylineOptions });
    return polylineOptions;
  }

  // Extracted method to calculate total distance and duration
  private getTotalDistanceAndDuration(steps: Step[] | undefined): {
    totalDistance: number;
    totalDuration: number;
  } {
    return (steps ?? []).reduce(
      (acc, step) => ({
        totalDistance: acc.totalDistance + (step.distance?.value ?? 0),
        totalDuration: acc.totalDuration + (step.duration?.value ?? 0)
      }),
      { totalDistance: 0, totalDuration: 0 }
    );
  }

  public async calculateShortestRoute(
    start: string | google.maps.LatLng,
    destination: string | google.maps.LatLng
  ): Promise<{ eta: string | null; distance: number; mode: string }> {
    const modes = ['DRIVING', 'WALKING', 'TRANSIT', 'SHUTTLE'];

    // Calculate routes for each mode in parallel.
    const results = await Promise.all(
      modes.map(async (mode) => {
        let steps: Step[] | undefined;
        let eta: string | null = null;
        if (mode == 'SHUTTLE') {
          ({ steps, eta } = await this.shuttleService.calculateShuttleBusRoute(
            start,
            destination,
            false
          ));
        } else {
          ({ steps, eta } = await this.calculateRoute(
            start,
            destination,
            this.getTravelMode(mode),
            false
          ));
        }
        let { totalDistance, totalDuration } = this.getTotalDistanceAndDuration(steps);
        if (mode == 'SHUTTLE') {
          totalDistance += 8091;
        }
        return { mode, eta, distance: totalDistance, duration: totalDuration };
      })
    );

    // Filter out routes with a zero duration.
    const validRoutes = results.filter((route) => route.duration > 0);

    if (validRoutes.length === 0) {
      // If all routes have a zero duration, handle this scenario as needed.
      return { eta: null, distance: 0, mode: 'No valid route' };
    }
    if (validRoutes.length === 0) {
      // If all routes have a zero duration, handle this scenario as needed.
      return { eta: null, distance: 0, mode: 'No valid route' };
    }

    // Find the route with the smallest duration.
    this.shortestRoute = validRoutes.reduce(
      (fastest, route) => (route.duration < fastest.duration ? route : fastest),
      results[0] // Initial value: the first route in the array
    );

    return {
      eta: this.shortestRoute.eta,
      distance: this.shortestRoute.distance,
      mode: this.shortestRoute.mode
    };
  }

  public async calculateDistanceETA(
    start: string | google.maps.LatLng,
    destination: string | google.maps.LatLng,
    mode: string
  ): Promise<{ eta: string | null; totalDistance: number }> {
    try {
      let steps;
      let eta: string | null = null;
      let totalDistance = 0;

      if (mode === 'SHUTTLE') {
        ({ steps, eta } = await this.shuttleService.calculateShuttleBusRoute(
          start,
          destination,
          false
        ));
        totalDistance = this.getTotalDistanceAndDuration(steps).totalDistance + 8091;
      } else {
        ({ steps, eta } = await this.calculateRoute(
          start,
          destination,
          this.getTravelMode(mode),
          false
        ));
        totalDistance = this.getTotalDistanceAndDuration(steps).totalDistance;
      }

      if (eta === 'N/A') eta = null;
      return { eta, totalDistance };
    } catch (error) {
      console.error('Error calculating distance and ETA:', error);
      return { eta: null, totalDistance: 0 };
    }
  }

  clearStartPoint(): void {
    if (this.startPoint$.value?.marker) {
      this.startPoint$.value.marker.setMap(null);
    }
    this.startPoint$.next(null);
    this.updateMapView();
  }

  clearDestinationPoint(): void {
    if (this.destinationPoint$.value?.marker) {
      this.destinationPoint$.value.marker.setMap(null);
    }
    this.destinationPoint$.next(null);
    this.updateMapView();
  }
}
