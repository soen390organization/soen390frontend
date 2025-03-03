import data from '../../../assets/ConcordiaData.json';
import { RouteService } from '../directions/directions.service';
import { Injectable, Injector } from '@angular/core';
import shuttleData from '../../../assets/ShuttleData.json';

@Injectable({
  providedIn: 'root',
})
export class ShuttleService {
  private placesService!: google.maps.places.PlacesService;
  private directionsService!: google.maps.DirectionsService;
  private renderers!: google.maps.DirectionsRenderer[];
  private routeService!: RouteService;
  private initialized = false;

  constructor(private readonly injector: Injector) {}

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
    if (!this.placesService) {
      this.placesService = new google.maps.places.PlacesService(map);
    }
    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }
  }

  /**
   * Main public method to calculate shuttle bus route between two addresses.
   */
  public async calculateShuttleBusRoute(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng
  ) {
    const { startCampus, destinationCampus } = await this.fetchCoordinates(
      startAddress,
      destinationAddress
    );

    const date = new Date();
    const nextBus = this.getNextBus(startCampus, date);

    if (this.isNoBusAvailable(nextBus)) {
      return this.buildNoBusResponse(nextBus);
    }

    const sameCampus = startCampus === destinationCampus;
    const steps = sameCampus
      ? await this.buildSameCampusSteps(startAddress, destinationAddress)
      : await this.buildDifferentCampusSteps(
          startAddress,
          destinationAddress,
          startCampus,
          destinationCampus,
          nextBus
        );

    return { steps: steps.steps, eta: steps.eta };
  }

  /**
   * Helper to load both coordinates and figure out which campuses they belong to.
   */
  private async fetchCoordinates(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng
  ) {
    const startCoords = await this.findCoords(startAddress);
    const destinationCoords = await this.findCoords(destinationAddress);

    const startCampus = this.getNearestCampus(startCoords);
    const destinationCampus = this.getNearestCampus(destinationCoords);

    return { startCoords, destinationCoords, startCampus, destinationCampus };
  }

  /**
   * Helper to check if the nextBus string means that no bus is available.
   */
  private isNoBusAvailable(nextBus: string): boolean {
    return (
      nextBus === 'No more shuttle buses today :(' ||
      nextBus === 'No departures for today.'
    );
  }

  /**
   * If no bus is available, return a standard response object.
   */
  private buildNoBusResponse(nextBus: string) {
    return {
      steps: [
        {
          instructions: nextBus,
          location: null,
        },
      ],
      eta: 'N/A',
    };
  }

  /**
   * Build steps for a same-campus trip (all walking).
   */
  private async buildSameCampusSteps(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng
  ) {
    const result = await this.routeService.calculateRoute(
      startAddress,
      destinationAddress,
      google.maps.TravelMode.WALKING
    );
    return { steps: result.steps, eta: result.eta };
  }

  /**
   * Build steps for an inter-campus trip (initial walk, shuttle, final walk).
   */
  private async buildDifferentCampusSteps(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng,
    startCampus: string,
    destinationCampus: string,
    nextBus: string
  ) {
    const terminalCodes = this.getTerminalCodes();
    const shuttleSteps: any[] = [];

    const initialWalk = await this.routeService.calculateRoute(
      startAddress,
      terminalCodes[startCampus],
      google.maps.TravelMode.WALKING,
      this.renderers[0]
    );
    shuttleSteps.push(...initialWalk.steps);

    const shuttleBus = await this.routeService.calculateRoute(
      terminalCodes[startCampus],
      terminalCodes[destinationCampus],
      google.maps.TravelMode.DRIVING,
      this.renderers[1]
    );
    shuttleSteps.push({
      instructions: `Next shuttle at ${nextBus} on ${startCampus.toUpperCase()} terminal.`,
      location: null,
    });

    const finalWalk = await this.routeService.calculateRoute(
      terminalCodes[destinationCampus],
      destinationAddress,
      google.maps.TravelMode.WALKING,
      this.renderers[2]
    );
    shuttleSteps.push(...finalWalk.steps);

    const initialWalkEta = Number(initialWalk.eta.replace(/\D/g, ''));
    const shuttleBusEta = Number(shuttleBus.eta.replace(/\D/g, ''));
    const finalWalkEta = Number(finalWalk.eta.replace(/\D/g, ''));
    const eta = `${initialWalkEta + shuttleBusEta + finalWalkEta} minutes`;

    return { steps: shuttleSteps, eta: eta };
  }

  /**
   * Return an object with terminal codes for each campus.
   */
  private getTerminalCodes() {
    return {
      sgw: `${shuttleData.terminals.sgw.terminal.lat}, ${shuttleData.terminals.sgw.terminal.lng}`,
      loy: `${shuttleData.terminals.loy.terminal.lat}, ${shuttleData.terminals.loy.terminal.lng}`,
    };
  }

  /**
   * Return the nearest campus to the given coordinates.
   */
  public getNearestCampus(coords: google.maps.LatLng) {
    const distanceToSGW = Math.sqrt(
      Math.pow(coords.lat() - data.sgw.coordinates.lat, 2) +
        Math.pow(coords.lng() - data.sgw.coordinates.lng, 2)
    );
    const distanceToLOY = Math.sqrt(
      Math.pow(coords.lat() - data.loy.coordinates.lat, 2) +
        Math.pow(coords.lng() - data.loy.coordinates.lng, 2)
    );

    return distanceToSGW < distanceToLOY ? 'sgw' : 'loy';
  }

  /**
   * Retrieves google.maps.LatLng from string or returns the same LatLng if already provided.
   */
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
            resolve(results[0].geometry.location);
          } else {
            reject(new Error('Error finding coords'));
          }
        }
      );
    });
  }

  /**
   * Return next shuttle bus departure time for a given campus & date.
   */
  public getNextBus(campus: string, date: Date): string {
    const dayOfWeek = date.toLocaleDateString(`en-us`, { weekday: 'long' });
    if (!shuttleData.schedule[dayOfWeek]) return 'No departures for today.';

    const currentTime = date.getHours() * 60 + date.getMinutes();
    const departures = shuttleData.schedule[dayOfWeek][campus];
    const nextDeparture = departures.find((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });

    return nextDeparture || 'No more shuttle buses today :(';
  }

  /**
   * Clear any directions displayed on the attached renderers.
   */
  public clearMapDirections() {
    this.renderers.forEach((renderer) => {
      renderer.set('directions', null);
    });
  }
}
