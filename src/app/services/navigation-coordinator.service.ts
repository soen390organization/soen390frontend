import { Injectable } from '@angular/core';
import { Location, CompleteRoute, RouteSegment } from '../interfaces/routing-strategy.interface';
import { OutdoorRoutingStrategy } from '../strategies/outdoor-routing.strategy';

@Injectable({
  providedIn: 'root'
})
export class NavigationCoordinatorService {
  constructor(private outdoorStrategy: OutdoorRoutingStrategy) {}

  /**
   * This method serves as the facade entry point for route calculation.
   * It inspects the start and destination and selects the appropriate strategy.
   */
  /* @TODO: we can maybe discremenate by IndoorLocation and OutdoorLocation for better seperation */
  async getCompleteRoute(start: Location, destination: Location, mode: string): Promise<CompleteRoute> {
    // If both locations are outdoor, use the OutdoorRoutingStrategy.
    if (start.type === 'outdoor' && destination.type === 'outdoor') {
      const segment: RouteSegment = await this.outdoorStrategy.getRoute(start, destination, mode);
      console.log('Outdoor route calculated:', segment);
      return { segments: [segment] };
    }
    // Future extension: handle indoor-to-indoor or mixed cases here.
    throw new Error("Only outdoor-to-outdoor routing is implemented at this time.");
  }

  /* @TODO: add the getCompleteDirections method */

  /* @TODO: investigate getCompleteETA method */
}
