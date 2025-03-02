import data from '../../../assets/ConcordiaData.json';
import shuttleData from '../../../assets/ShuttleBusData.json';
import { RouteService } from '../directions/directions.service';
import { Injectable, Injector } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ShuttleService {
  private placesService!: google.maps.places.PlacesService;
  private renderers!: google.maps.DirectionsRenderer[];
  private routeService!: RouteService;
  private initialized = false;

  // use injector to inject routeservice dynamically
  constructor(private injector: Injector) {}

  public initialize(map: google.maps.Map): void {
    if (!this.initialized) {
      this.routeService = this.injector.get(RouteService);
      this.initialized = true;
    }

    if (!this.renderers) {
      this.renderers = [];
      const renderer1 = this.routeService.getDirectionsRenderer();
      const renderer2 = new google.maps.DirectionsRenderer();
      const renderer3 = new google.maps.DirectionsRenderer();
      renderer2.setMap(map);
      renderer3.setMap(map);
      this.renderers.push(renderer1, renderer2, renderer3);
    }
    if (!this.placesService)
      this.placesService = new google.maps.places.PlacesService(map);
  }

  async calculateShuttleBusRoute(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng
  ) {
    const startCoords = await this.findCoords(startAddress);
    const destinationCoords = await this.findCoords(destinationAddress);

    const terminalCodes = {
      sgw: `${shuttleData.sgw.terminal.lat}, ${shuttleData.sgw.terminal.lng}`,
      loy: `${shuttleData.loy.terminal.lat}, ${shuttleData.loy.terminal.lng}`,
    };

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
      const steps = await this.routeService.calculateRoute(
        startAddress,
        destinationAddress,
        google.maps.TravelMode.WALKING
      );
      shuttleSteps.push(steps.steps);
    } else {
      const initialWalk = await this.routeService.calculateRoute(
        startAddress,
        terminalCodes[startCampus],
        google.maps.TravelMode.WALKING,
        this.renderers[0]
      );
      // fails here
      const shuttleBus = await this.routeService.calculateRoute(
        terminalCodes[startCampus],
        terminalCodes[destinationCampus],
        google.maps.TravelMode.DRIVING,
        this.renderers[1]
      );
      const finalWalk = await this.routeService.calculateRoute(
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
    console.log(this.renderers);
    this.renderers.forEach((renderer) => {
      renderer.set('directions', null);
    });
  }
}
