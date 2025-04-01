import { Injectable } from '@angular/core';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { DirectionsService } from '../abstract-directions.service';
import { OutdoorWalkingStrategy, OutdoorDrivingStrategy, OutdoorTransitStrategy, OutdoorShuttleStrategy } from 'src/app/strategies/outdoor-directions';
import { AbstractOutdoorStrategy } from 'src/app/strategies/outdoor-directions/abstract-outdoor.strategy';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OutdoorDirectionsService extends DirectionsService<GoogleMapLocation> {
  public selectedStrategySubject = new BehaviorSubject<AbstractOutdoorStrategy | null>(null);

  constructor(
    public readonly outdoorWalkingStrategy: OutdoorWalkingStrategy,
    public readonly outdoorDrivingStrategy: OutdoorDrivingStrategy,
    public readonly outdoorTransitStrategy: OutdoorTransitStrategy,
    public readonly outdoorShuttleStrategy: OutdoorShuttleStrategy
  ) {
    super();
    this.setTravelMode('WALKING');
  }

  // Make observable
  public getSelectedStrategy$() {
    return this.selectedStrategySubject.asObservable();
  }

  public async getSelectedStrategy() {
    return await firstValueFrom(this.getSelectedStrategy$());
  }

  public setSelectedStrategy(strategy: AbstractOutdoorStrategy) {
    console.log('SET STRAT')
    this.selectedStrategySubject.next(strategy);
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

    console.log('STRATS: ', strategies)

    // Return the strategy with the smallest duration
    return strategies
      .filter(strategy => strategy)
      .reduce((prev, curr) => (prev.getTotalDuration().value < curr.getTotalDuration().value ? prev : curr));
  }

  public async renderNavigation() {
    (await this.getSelectedStrategy()).renderRoutes();
  }

  public async clearNavigation(): Promise<void> {
    (await this.getSelectedStrategy()).clearRenderedRoutes();
  }
}
