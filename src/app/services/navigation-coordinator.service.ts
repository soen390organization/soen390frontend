import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompleteRoute, RouteSegment } from '../interfaces/routing-strategy.interface';
import { Location } from '../interfaces/location.interface';
import { OutdoorRoutingStrategy, IndoorRoutingStrategy } from '../strategies';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';
import { MappedInLocation } from '../interfaces/mappedin-location.interface';
import { Store } from '@ngrx/store';
import { setMapType, MapType, setShowRoute } from 'src/app/store/app';
import { IndoorDirectionsService } from './indoor-directions/indoor-directions.service';
import { OutdoorDirectionsService } from './outdoor-directions/outdoor-directions.service';
import { CurrentLocationService } from './current-location/current-location.service';
import { PlacesService } from './places/places.service';
import { MappedinService } from './mappedin/mappedin.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationCoordinatorService {
  // Global observable that emits a new route when any of the location points update.
  public globalRoute$: Observable<CompleteRoute>;

  constructor(
    private readonly store: Store,
    private readonly outdoorStrategy: OutdoorRoutingStrategy,
    private readonly indoorStrategy: IndoorRoutingStrategy,
    private readonly outdoorDirectionsService: OutdoorDirectionsService,
    private readonly indoorDirectionService: IndoorDirectionsService,
    private readonly currentLocationService: CurrentLocationService,
    private readonly placesService: PlacesService,
    private readonly mappedInService: MappedinService
  ) {
    // Combine the four observables (outdoor start/destination and indoor start/destination)
  }

  /**
   * Finds the best indoor location match for a given room or building code
   * Delegates to the MappedinService's findIndoorLocation method
   * @param roomCode The room code or classroom code to find
   * @returns A promise that resolves to the best indoor location match
   */
  private async findIndoorLocation(roomCode: string): Promise<MappedInLocation | null> {
    return this.mappedInService.findIndoorLocation(roomCode);
  }

  /* used for on demand calculation */
  async getCompleteRoute(
    start: Location,
    destination: Location,
    mode: string
  ): Promise<CompleteRoute> {
    // Set mapType in store
    if (start.type === 'outdoor' && destination.type === 'outdoor') {
      this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
    } else if (start.type === 'indoor' && destination.type === 'indoor') {
      this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
    }

    let segment: RouteSegment;
    if (start.type === 'outdoor' && destination.type === 'outdoor') {
      segment = await this.outdoorStrategy.getRoute(
        start as GoogleMapLocation,
        destination as GoogleMapLocation,
        mode
      );
    } else if (start.type === 'indoor' && destination.type === 'indoor') {
      segment = await this.indoorStrategy.getRoute(
        start as MappedInLocation,
        destination as MappedInLocation,
        mode
      );
    } else {
      throw new Error('Mixed routing not implemented yet.');
    }

    return { segments: [segment] };
  }
}
