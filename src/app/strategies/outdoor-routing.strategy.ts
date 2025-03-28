import { Injectable } from '@angular/core';
import { RoutingStrategy, RouteSegment } from '../interfaces/routing-strategy.interface';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';
import { DirectionsService } from '../services/directions/directions.service';

@Injectable({
  providedIn: 'root'
})
export class OutdoorRoutingStrategy implements RoutingStrategy {
  constructor(private directionsService: DirectionsService) {}

  async getRoute(
    start: GoogleMapLocation,
    destination: GoogleMapLocation,
    mode: string
  ): Promise<RouteSegment> {
    if (!start.address || !destination.address) {
      throw new Error('Outdoor routing requires addresses for both start and destination.');
    }
    const instructions = await this.directionsService.generateRoute(
      start.address,
      destination.address,
      mode
    );
    return { type: 'outdoor', instructions };
  }
}
