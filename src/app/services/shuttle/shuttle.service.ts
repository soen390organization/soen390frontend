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
    if (!this.directionsService)
      this.directionsService = new google.maps.DirectionsService();
  }

  async calculateShuttleBusRoute(
    startAddress: string | google.maps.LatLng,
    destinationAddress: string | google.maps.LatLng
  ) {
    const terminalCodes = {
      sgw: `${shuttleData.terminals.sgw.terminal.lat}, ${shuttleData.terminals.sgw.terminal.lng}`,
      loy: `${shuttleData.terminals.loy.terminal.lat}, ${shuttleData.terminals.loy.terminal.lng}`,
    };

    const startCoords = await this.findCoords(startAddress);
    const destinationCoords = await this.findCoords(destinationAddress);

    const shuttleSteps = [];
    const startCampus = this.getNearestCampus(startCoords);
    const destinationCampus = this.getNearestCampus(destinationCoords);

    const sameCampus = startCampus === destinationCampus;

    const date = new Date();
    const nextBus = this.getNextBus(startCampus, date);

    if (
      nextBus === 'No more shuttle buses today :(' ||
      nextBus === 'No departures for today.'
    ) {
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
      await this.routeService.calculateRoute(
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
      shuttleSteps.push({
        instructions: `Next shuttle at ${nextBus} on ${startCampus.toUpperCase()} terminal.`,
        location: null,
      });
      shuttleSteps.push(...finalWalk.steps);
    }

    return { steps: shuttleSteps, eta: 'TBD' };
  }

  getNearestCampus(coords: google.maps.LatLng) {
    const distanceToSGW = Math.sqrt(
      Math.pow(coords.lat() - data.sgw.coordinates.lat, 2) +
        Math.pow(coords.lng() - data.sgw.coordinates.lng, 2)
    );
    const distanceToLOY = Math.sqrt(
      Math.pow(coords.lat() - data.loy.coordinates.lat, 2) +
        Math.pow(coords.lng() - data.loy.coordinates.lng, 2)
    );

    const nearestCampus = distanceToSGW < distanceToLOY ? 'sgw' : 'loy';

    return nearestCampus;
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
            resolve(results[0].geometry.location);
          } else {
            reject(null);
          }
        }
      );
    });
  }

  public getNextBus(campus: String, date: Date): String {
    const dayOfWeek = date.toLocaleDateString(`en-us`, { weekday: 'long' });

    if (!shuttleData.schedule[dayOfWeek]) return 'No departures for today.';

    const currentTime = date.getHours() * 60 + date.getMinutes();

    const departures = shuttleData.schedule[dayOfWeek][campus];
    const nextDeparture = departures.find((time: String) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });

    return nextDeparture
      ? `${nextDeparture}`
      : 'No more shuttle buses today :(';
  }

  public clearMapDirections() {
    this.renderers.forEach((renderer) => {
      renderer.set('directions', null);
    });
  }
}
