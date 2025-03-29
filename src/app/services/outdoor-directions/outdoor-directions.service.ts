import { Injectable } from '@angular/core';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { DirectionsService } from '../abstract-directions.service';
import { OutdoorWalkingStrategy, OutdoorDrivingStrategy, OutdoorTransitStrategy, OutdoorShuttleStrategy } from 'src/app/strategies/outdoor-directions';
import { AbstractOutdoorStrategy } from 'src/app/strategies/outdoor-directions/abstract-outdoor.strategy';

@Injectable({
  providedIn: 'root'
})
export class OutdoorDirectionsService extends DirectionsService<GoogleMapLocation> {
  public selectedStrategy: AbstractOutdoorStrategy

  constructor(
    private readonly outdoorWalkingStrategy: OutdoorWalkingStrategy,
    private readonly outdoorDrivingStrategy: OutdoorDrivingStrategy,
    private readonly outdoorTransitStrategy: OutdoorTransitStrategy,
    private readonly outdoorShuttleStrategy: OutdoorShuttleStrategy
  ) {
    super();
    this.setTravelMode('WALKING');
  }

  public async getShortestRoute() {
    // Grab origin from StartPoint & destination from DestinationPoint
    const [origin, destination] = await Promise.all([
      (await this.getStartPoint()).address,
      (await this.getDestinationPoint()).address
    ]);
    // Load all Strategies
     const strategies = await Promise.all([
      await this.outdoorWalkingStrategy.getRoutes(origin, destination),
      await this.outdoorDrivingStrategy.getRoutes(origin, destination),
      await this.outdoorTransitStrategy.getRoutes(origin, destination),
      await this.outdoorShuttleStrategy.getRoutes(origin, destination)
    ]);
    console.log(strategies[3])
    // Find the strategy with the smallest duration
    const strategyWithShortestRoute = strategies.reduce((prev, curr) => (prev.getTotalDuration().value < curr.getTotalDuration().value ? prev : curr));
    console.log('Shortest Route Strategy: ', strategyWithShortestRoute)

    this.selectedStrategy = strategyWithShortestRoute;
    // this.selectedStrategy.renderRoutes();
    strategies[3].renderRoutes();
    console.log(strategies[3].getTotalSteps())
  }

  public async renderNavigation() {
    this.selectedStrategy.renderRoutes();
  }

  public async clearNavigation(): Promise<void> {
    this.selectedStrategy.clearRenderedRoutes();
  }
}
