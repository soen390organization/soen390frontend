import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompleteRoute, RouteSegment } from '../interfaces/routing-strategy.interface';
import { Location } from '../interfaces/location.interface';
// import { OutdoorRoutingStrategy, IndoorRoutingStrategy } from '../strategies';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';
import { MappedInLocation } from '../interfaces/mappedin-location.interface';
import { Store } from '@ngrx/store';
import { setMapType, MapType } from 'src/app/store/app';

@Injectable({
  providedIn: 'root'
})
export class NavigationCoordinatorService {
  // Global observable that emits a new route when any of the location points update.
  public globalRoute$: Observable<CompleteRoute>;

  constructor(private readonly store: Store) {
    // Combine the four observables (outdoor start/destination and indoor start/destination)
  }

  //   /* used for on demand calculation */
  //   async getCompleteRoute(
  //     start: Location,
  //     destination: Location,
  //     mode: string
  //   ): Promise<CompleteRoute> {
  //     // Set mapType in store
  //     if (start.type === 'outdoor' && destination.type === 'outdoor') {
  //       this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
  //     } else if (start.type === 'indoor' && destination.type === 'indoor') {
  //       this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
  //     }

  //     let segment: RouteSegment;
  //     if (start.type === 'outdoor' && destination.type === 'outdoor') {
  //       segment = await this.outdoorStrategy.getRoute(
  //         start as GoogleMapLocation,
  //         destination as GoogleMapLocation,
  //         mode
  //       );
  //     } else if (start.type === 'indoor' && destination.type === 'indoor') {
  //       segment = await this.indoorStrategy.getRoute(
  //         start as MappedInLocation,
  //         destination as MappedInLocation,
  //         mode
  //       );
  //     } else {
  //       throw new Error('Mixed routing not implemented yet.');
  //     }

  //     return { segments: [segment] };
  //   }
}
