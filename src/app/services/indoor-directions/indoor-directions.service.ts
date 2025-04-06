import { Injectable } from '@angular/core';
import { MappedinService } from '../mappedin/mappedin.service';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { DirectionsService } from '../abstract-directions.service';
import {
  IndoorDifferentBuildingStrategy,
  IndoorSameBuildingStrategy
} from 'src/app/strategies/indoor-directions';
import { firstValueFrom, BehaviorSubject } from 'rxjs';
import { AbstractIndoorStrategy } from 'src/app/strategies/indoor-directions/abstract-indoor.strategy';

/**
 * Service for handling indoor directions using the Mappedin system.
 *
 * This service extends the abstract DirectionsService with a MappedInLocation type and
 * provides functionality to retrieve entrances for start and destination points, generate
 * navigation directions, and render these directions on the map view.
 */
@Injectable({
  providedIn: 'root'
})
export class IndoorDirectionsService extends DirectionsService<MappedInLocation> {
  public selectedStrategySubject = new BehaviorSubject<AbstractIndoorStrategy>(null);

  /**
   * Creates an instance of IndoorDirectionsService.
   *
   * @param mappedinService - An instance of MappedinService for accessing map data and view.
   */
  constructor(
    private readonly mappedinService: MappedinService,
    private readonly indoorSameBuildingStrategy: IndoorSameBuildingStrategy,
    private readonly indoorDifferentBuildingStrategy: IndoorDifferentBuildingStrategy
  ) {
    super();
  }

  // Make observable
  public getSelectedStrategy$() {
    return this.selectedStrategySubject.asObservable();
  }

  public async getSelectedStrategy() {
    return await firstValueFrom(this.getSelectedStrategy$());
  }

  public setSelectedStrategy(strategy: AbstractIndoorStrategy) {
    this.selectedStrategySubject.next(strategy);
  }

  public async getInitializedRoutes() {
    // Grab origin from StartPoint & destination from DestinationPoint
    const [origin, destination] = await Promise.all([
      await this.getStartPoint(),
      await this.getDestinationPoint()
    ]);

    // Load all Strategies
    const [sameBuildingStrategy, differentBuildingStrategy] = await Promise.all([
      await this.indoorSameBuildingStrategy.getRoutes(origin, destination),
      await this.indoorDifferentBuildingStrategy.getRoutes(origin, destination)
    ]);

    if (origin.indoorMapId === destination.indoorMapId) {
      return sameBuildingStrategy;
    } else {
      return differentBuildingStrategy;
    }
  }

  public async renderNavigation() {
    (await this.getSelectedStrategy()).renderRoutes();
  }

  public async clearNavigation(): Promise<void> {
    const mapView = this.mappedinService.mapView;
    if (mapView?.Navigation?.clear instanceof Function) {
      try {
        mapView.Navigation.clear();
      } catch (error) {
        console.error('Error clearing indoor navigation:', error);
      }
    }
  }
}
