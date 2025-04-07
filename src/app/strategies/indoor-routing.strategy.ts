import { Injectable } from '@angular/core';
import { RoutingStrategy, RouteSegment } from '../interfaces/routing-strategy.interface';
import { MappedInLocation } from '../interfaces/mappedin-location.interface';
import { MappedinService } from '../services/mappedin/mappedin.service';

@Injectable({
  providedIn: 'root'
})
export class IndoorRoutingStrategy implements RoutingStrategy {
  constructor(private readonly mappedInService: MappedinService) {}

  async getRoute(
    start: MappedInLocation,
    destination: MappedInLocation,
    mode: string
  ): Promise<RouteSegment> {
    if (start.type !== 'indoor' || destination.type !== 'indoor') {
      throw new Error('Indoor routing requires both start and destination to be indoor.');
    }

    // Ensure the map data is loaded for the indoor map.
    if (start.indoorMapId && start.indoorMapId !== this.mappedInService.getMapId()) {
      await this.mappedInService.setMapData(start.indoorMapId);
    }

    const instructions = {};
    return { type: 'indoor', instructions };
  }
}
