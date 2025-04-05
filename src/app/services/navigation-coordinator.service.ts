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
    private readonly currentLocationService: CurrentLocationService
  ) {
    // Combine the four observables (outdoor start/destination and indoor start/destination)
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

  /**
   * Creates a route from the user's current location to the specified destination
   * This is primarily used for the event-card component
   */
  async routeFromCurrentLocationToDestination(destination: any): Promise<void> {
    try {
      // Get current location
      const position = await this.currentLocationService.getCurrentLocation();
      if (!position) {
        throw new Error('Unable to get current location');
      }

      // Set current location as start point
      const startLocation: GoogleMapLocation = {
        title: 'Your Location',
        address: `${position.lat}, ${position.lng}`,
        coordinates: new google.maps.LatLng(position),
        type: 'outdoor'
      };

      // Log points for debugging
      console.log('Start location:', startLocation);
      console.log('Destination:', destination);
      
      // Make sure destination has valid coordinates
      if (!destination.coordinates || 
          !destination.coordinates.lat || 
          typeof destination.coordinates.lat !== 'function') {
        console.error('Invalid destination coordinates', destination.coordinates);
        // Try to fix the coordinates if they're strings or numbers
        if (destination.coordinates && 
            (typeof destination.coordinates.lat === 'string' || 
             typeof destination.coordinates.lat === 'number')) {
          destination.coordinates = new google.maps.LatLng(
            parseFloat(destination.coordinates.lat), 
            parseFloat(destination.coordinates.lng)
          );
        } else {
          throw new Error('Cannot create route with invalid coordinates');
        }
      }

      // Set start points in both services
      this.outdoorDirectionsService.setStartPoint(startLocation);
      // Show start marker
      this.outdoorDirectionsService.showStartMarker();
      
      // Set destination based on type
      if (destination.type === 'indoor') {
        // Set destination for indoor directions
        this.indoorDirectionService.setDestinationPoint(destination);
        
        // Also set for outdoor to maintain consistency
        this.outdoorDirectionsService.setDestinationPoint({
          title: destination.fullName || destination.title,
          address: destination.address,
          coordinates: destination.coordinates,
          type: 'outdoor'
        });
        
        // Show destination marker
        this.outdoorDirectionsService.showDestinationMarker();
        
        // Set map type to indoor
        this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
        
        // Render indoor navigation
        await this.indoorDirectionService.renderNavigation();
      } else {
        // Set destination for outdoor directions
        this.outdoorDirectionsService.setDestinationPoint(destination);
        
        // Show destination marker
        this.outdoorDirectionsService.showDestinationMarker();
        
        // Set map type to outdoor
        this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
        
        // Get and render outdoor navigation
        const strategy = await this.outdoorDirectionsService.getShortestRoute();
        if (!strategy) {
          console.error('No valid routing strategy found');
          return;
        }
        
        this.outdoorDirectionsService.setSelectedStrategy(strategy);
        this.outdoorDirectionsService.renderNavigation();
      }
      
      // Show the route
      this.store.dispatch(setShowRoute({ show: true }));
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  }
}
