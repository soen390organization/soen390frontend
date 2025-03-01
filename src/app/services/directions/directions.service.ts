import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Step } from '../../interfaces/step.interface';
import data from '../../../assets/ConcordiaData.json';

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
export class RouteService {
  private directionsService!: google.maps.DirectionsService;
  private renderers!: google.maps.DirectionsRenderer[];
  private placesService!: google.maps.places.PlacesService;
  private startPoint$ = new BehaviorSubject<Location | null>(null);
  private destinationPoint$ = new BehaviorSubject<Location | null>(null);

  constructor() {}

  public initialize(map: google.maps.Map): void {
    if (!this.directionsService)
      this.directionsService = new google.maps.DirectionsService();
    if (!this.renderers) {
      this.renderers = [];
      const renderer1 = new google.maps.DirectionsRenderer();
      const renderer2 = new google.maps.DirectionsRenderer();
      const renderer3 = new google.maps.DirectionsRenderer();
      renderer1.setMap(map);
      renderer2.setMap(map);
      renderer3.setMap(map);
      this.renderers.push(renderer1, renderer2, renderer3);
    }
    if (!this.placesService)
      this.placesService = new google.maps.places.PlacesService(map);
  }

  getDirectionsService(): google.maps.DirectionsService {
    return this.directionsService;
  }

  getDirectionsRenderer(): google.maps.DirectionsRenderer[] {
    return this.renderers;
  }

  getStartPoint(): Observable<Location | null> {
    return this.startPoint$.asObservable();
  }

  setStartPoint(location: Location): void {
    const marker =
      this.startPoint$.value?.marker ??
      new google.maps.Marker({
        position: location.coordinates,
        map: this.renderers[0].getMap(),
        icon: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg',
          scaledSize: new google.maps.Size(40, 40),
        },
      });

    marker.setPosition(location.coordinates);

    this.startPoint$.next({ ...location, marker });
    this.updateMapView();
  }

  getDestinationPoint(): Observable<Location | null> {
    return this.destinationPoint$.asObservable();
  }

  setDestinationPoint(location: Location): void {
    const marker =
      this.destinationPoint$.value?.marker ??
      new google.maps.Marker({
        position: location.coordinates,
        map: this.renderers[0].getMap(),
        icon: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg',
          scaledSize: new google.maps.Size(40, 40),
        },
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

  private updateMapView() {
    const map = this.renderers[0].getMap();

    const startPoint = this.startPoint$.value;
    const destinationPoint = this.destinationPoint$.value;

    if (startPoint && destinationPoint) {
      this.generateRoute(
        startPoint.address,
        destinationPoint.address,
        google.maps.TravelMode.WALKING
      );
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
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING,
    renderer: google.maps.DirectionsRenderer = this.renderers[0]
  ): Promise<{
    steps: Step[];
    eta: string | null;
  }> {
    console.log(
      `starting at: ${startAddress}, ending at: ${destinationAddress}`
    );
    return new Promise((resolve, reject) => {

      this.setRouteColor(travelMode, renderer);
      console.log('route colors set');

      const request: google.maps.DirectionsRequest = {
        origin: startAddress,
        destination: destinationAddress,
        travelMode: travelMode,
      };
      this.directionsService.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          renderer.setDirections(response);

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
          console.log('route steps: ', steps);

          resolve({ steps, eta });
        } else {
          reject(status);
        }
      });
    });
  }

  async calculateShuttleBusRoute(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng
  ) {
    const startCoords = await this.findCoords(startAddress);
    const destinationCoords = await this.findCoords(destinationAddress);

    const terminalCodes = {
      'sgw': `${data.sgw.shuttleBus.terminal.lat}, ${data.sgw.shuttleBus.terminal.lng}`,
      'loy': `${data.loy.shuttleBus.terminal.lat}, ${data.loy.shuttleBus.terminal.lng}`
    }


    if (!startCoords || !destinationCoords) {
      throw new Error('Start place not found');
    }

    const startDistanceToSGW = Math.sqrt(
      Math.pow(startCoords.lat() - data.sgw.coordinates.lat, 2) +
        Math.pow(startCoords.lng() - data.sgw.coordinates.lng, 2)
    );
    const startDistanceToLOY = Math.sqrt(
      Math.pow(startCoords.lat() - data.loy.coordinates.lat, 2) +
        Math.pow(startCoords.lng() - data.loy.coordinates.lng, 2)
    );
    const destinationDistanceToSGW = Math.sqrt(
      Math.pow(destinationCoords.lat() - data.sgw.coordinates.lat, 2) +
        Math.pow(destinationCoords.lng() - data.sgw.coordinates.lng, 2)
    );
    const destinationDistanceToLOY = Math.sqrt(
      Math.pow(destinationCoords.lat() - data.loy.coordinates.lat, 2) +
        Math.pow(destinationCoords.lng() - data.loy.coordinates.lng, 2)
    );

    const startCampus = startDistanceToSGW < startDistanceToLOY ? 'sgw' : 'loy';
    const destinationCampus =
      destinationDistanceToSGW < destinationDistanceToLOY ? 'sgw' : 'loy';
    const shuttleSteps = [];

    const sameCampus = startCampus === destinationCampus;

    if (sameCampus) {
      const steps = await this.calculateRoute(
        startAddress,
        destinationAddress,
        google.maps.TravelMode.WALKING
      );
      shuttleSteps.push(steps.steps);
    } else {
      const initialWalk = await this.calculateRoute(
        startAddress,
        terminalCodes[startCampus],
        google.maps.TravelMode.WALKING,
        this.renderers[0]
      );
      // fails here
      const shuttleBus = await this.calculateRoute(
        terminalCodes[startCampus],
        terminalCodes[destinationCampus],
        google.maps.TravelMode.DRIVING,
        this.renderers[1]
      );
      const finalWalk = await this.calculateRoute(
        terminalCodes[destinationCampus],
        destinationAddress,
        google.maps.TravelMode.WALKING,
        this.renderers[2]
      );

      shuttleSteps.push(...initialWalk.steps);
      shuttleSteps.push(...shuttleBus.steps);
      shuttleSteps.push(...finalWalk.steps);
    }

    return { steps: shuttleSteps, eta: 'TBD' };
  }

  generateRoute(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng,
    travelMode: string | google.maps.TravelMode = google.maps.TravelMode.WALKING
  ) {
    this.clearMapDirections();
    if (travelMode === 'SHUTTLE') {
      return this.calculateShuttleBusRoute(startAddress, destinationAddress);
    } else {
      return this.calculateRoute(
        startAddress,
        destinationAddress,
        this.getTravelMode(travelMode)
      );
    }
  }

  setRouteColor(
    travelMode: google.maps.TravelMode,
    renderer: google.maps.DirectionsRenderer
  ): google.maps.PolylineOptions {
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
    renderer.setOptions({ polylineOptions });
    return polylineOptions;
  }

  private findCoords(
    query: string | google.maps.LatLng
  ): Promise<google.maps.LatLng | null> {
    if (query instanceof google.maps.LatLng) {
      return Promise.resolve(query);
    }
    return new Promise((resolve, reject) => {
      this.placesService.findPlaceFromQuery(
        { query, fields: ['geometry', 'formatted_address'] },
        (results: any, status: any) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results.length > 0
          ) {
            console.log(results[0].geometry.location);
            resolve(results[0].geometry.location);
          } else {
            reject(null);
          }
        }
      );
    });
  }
  public clearMapDirections() {
    this.renderers.forEach((renderer) => {
      renderer.setDirections(null);
    });
  }
}
