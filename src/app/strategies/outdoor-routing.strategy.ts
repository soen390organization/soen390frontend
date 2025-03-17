import { Injectable } from '@angular/core';
import { RoutingStrategy, Location, RouteSegment } from '../interfaces/routing-strategy.interface';
import { DirectionsService } from '../services/directions/directions.service';

@Injectable({
  providedIn: 'root'
})
export class OutdoorRoutingStrategy implements RoutingStrategy {
  constructor(private directionsService: DirectionsService) {}

  async getRoute(start: Location, destination: Location): Promise<RouteSegment> {
    if (!start.address || !destination.address) {
      throw new Error("Outdoor routing requires addresses for both start and destination.");
    }
    // Delegate to the existing DirectionsService method
    const instructions = await this.directionsService.calculateShortestRoute(
      start.address,
      destination.address
    );
    console.log('Shortest Outdoor route calculated:', instructions);
    return { type: 'outdoor', instructions };
  }
}
