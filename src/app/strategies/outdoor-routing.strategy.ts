import { Injectable } from '@angular/core';
import { RoutingStrategy, RouteSegment } from '../interfaces/routing-strategy.interface';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';

@Injectable({
  providedIn: 'root'
})
export class OutdoorRoutingStrategy implements RoutingStrategy {
  constructor() {}

  async getRoute(
    start: GoogleMapLocation,
    destination: GoogleMapLocation,
    mode: string
  ): Promise<RouteSegment> {
    if (!start.address || !destination.address) {
      throw new Error('Outdoor routing requires addresses for both start and destination.');
    }
    return { type: 'outdoor', instructions: {} };
  }
}
