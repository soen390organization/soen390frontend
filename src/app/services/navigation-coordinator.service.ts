// import { Injectable } from '@angular/core';
// import { combineLatest, Observable, from } from 'rxjs';
// import { filter, switchMap, map } from 'rxjs/operators';
// import { CompleteRoute, RouteSegment } from '../interfaces/routing-strategy.interface';
// import { Location } from '../interfaces/location.interface';
// import { OutdoorRoutingStrategy, IndoorRoutingStrategy } from '../strategies';
// import { GoogleMapLocation } from '../interfaces/google-map-location.interface';
// import { MappedInLocation } from '../interfaces/mappedin-location.interface';
// import { OutdoorDirectionsService } from './outdoor-directions/outdoor-directions.service';
// import { IndoorDirectionsService } from '../services/indoor-directions/indoor-directions.service';
// import { Store } from '@ngrx/store';
// import { setMapType, MapType, selectCurrentMap } from 'src/app/store/app';

// @Injectable({
//   providedIn: 'root'
// })
// export class NavigationCoordinatorService {
//   // Global observable that emits a new route when any of the location points update.
//   public globalRoute$: Observable<CompleteRoute>;

//   constructor(
//     private store: Store,
//     private outdoorDirectionsService: OutdoorDirectionsService,
//     private indoorDirectionsService: IndoorDirectionsService,
//     private outdoorStrategy: OutdoorRoutingStrategy,
//     private indoorStrategy: IndoorRoutingStrategy
//   ) {
//     // Combine the four observables (outdoor start/destination and indoor start/destination)
//     this.globalRoute$ = combineLatest([
//       this.outdoorDirectionsService.getStartPoint(),
//       this.outdoorDirectionsService.getDestinationPoint(),
//       this.indoorDirectionsService.getStartPoint(),
//       this.indoorDirectionsService.getDestinationPoint()
//     ]).pipe(
//       // useful when wanting to make reactive changes (good for mixed routes later)
//       filter(([outdoorStart, outdoorDest, indoorStart, indoorDest]) => {
//         return (!!outdoorStart && !!outdoorDest) || (!!indoorStart && !!indoorDest);
//       }),
//       switchMap(([outdoorStart, outdoorDest, indoorStart, indoorDest]) => {
//         if (outdoorStart && outdoorDest) {
//           return from(
//             this.outdoorStrategy.getRoute(
//               outdoorStart as GoogleMapLocation,
//               outdoorDest as GoogleMapLocation,
//               'WALKING'
//             )
//           ).pipe(map((segment: RouteSegment) => ({ segments: [segment] }) as CompleteRoute));
//         } else if (indoorStart && indoorDest) {
//           return from(
//             this.indoorStrategy.getRoute(
//               indoorStart as MappedInLocation,
//               indoorDest as MappedInLocation,
//               'WALKING'
//             )
//           ).pipe(map((segment: RouteSegment) => ({ segments: [segment] }) as CompleteRoute));
//         } else {
//           throw new Error('Route not available');
//         }
//       })
//     );
//   }

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
// }
