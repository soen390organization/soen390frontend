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
   * Uses similar logic to the PlacesService's getPlaceSuggestions method
   * @param roomCode The room code or classroom code to find
   * @returns A promise that resolves to the best indoor location match
   */
  private async findIndoorLocation(roomCode: string): Promise<MappedInLocation | null> {
    if (!roomCode) {
      console.warn('Cannot find indoor location for empty room code');
      return null;
    }
    
    console.log('Finding indoor location for room code:', roomCode);
    
    try {
      // Get all campus building data
      const campusData = this.mappedInService.getCampusMapData() || {};
      if (Object.keys(campusData).length === 0) {
        console.warn('No campus data available');
        return null;
      }
      
      // Extract building code from room code (e.g., 'H-531' -> 'H')
      // This is a simple extraction - you may need more sophisticated parsing
      const buildingCode = roomCode.split(/[-\s]/)[0].toUpperCase();
      console.log('Extracted building code:', buildingCode);
      
      // Find matching building
      let matchingBuilding: any = null;
      let matchingMapId = null;
      
      for (const [mapId, building] of Object.entries(campusData) as [string, any][]) {
        if (building.abbreviation && building.abbreviation.toUpperCase() === buildingCode) {
          matchingBuilding = building;
          matchingMapId = mapId;
          console.log('Found matching building:', building.name);
          break;
        }
      }
      
      if (!matchingBuilding || !matchingMapId) {
        console.warn('No matching building found for code:', buildingCode);
        
        // If no direct match, try a more fuzzy search
        const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedCode = normalizeString(buildingCode);
        
        for (const [mapId, building] of Object.entries(campusData) as [string, any][]) {
          if (
            building.abbreviation && 
            building.name &&
            (normalizeString(building.abbreviation).includes(normalizedCode) ||
            normalizeString(building.name).includes(normalizedCode))
          ) {
            matchingBuilding = building;
            matchingMapId = mapId;
            console.log('Found fuzzy matching building:', building.name);
            break;
          }
        }
        
        // If still no match, just take the first building (normally Hall building)
        if (!matchingBuilding) {
          const firstMapId = Object.keys(campusData)[0];
          matchingBuilding = campusData[firstMapId];
          matchingMapId = firstMapId;
          console.log('Using default building:', matchingBuilding?.name || 'Unknown');
        }
      }
      
      // Now try to find the specific room within the building
      if (matchingBuilding && matchingMapId) {
        const mapData = matchingBuilding.mapData;
        
        // Try to find room by name (exact match)
        const roomNumberPart = roomCode.split(/[-\s]/)[1] || '';
        console.log('Looking for room number:', roomNumberPart);
        
        let bestRoom: any = null;
        
        // First check spaces
        const spaces = mapData.getByType('space') || [];
        for (const space of spaces) {
          if (space.name && (
              space.name === roomNumberPart || 
              space.name.includes(roomNumberPart) ||
              roomCode.includes(space.name))) {
            bestRoom = space;
            console.log('Found matching space:', space.name);
            break;
          }
        }
        
        // If no match in spaces, check points of interest
        if (!bestRoom) {
          const pois = mapData.getByType('point-of-interest') || [];
          for (const poi of pois) {
            if (poi.name && (
                poi.name === roomNumberPart ||
                poi.name.includes(roomNumberPart) ||
                roomCode.includes(poi.name))) {
              bestRoom = poi;
              console.log('Found matching POI:', poi.name);
              break;
            }
          }
          
          // If still no match, use a room on the first floor as default
          if (!bestRoom && spaces.length > 0) {
            try {
              // Get rooms on the first floor
              const floors = mapData.getByType('floor') || [];
              const firstFloor = floors.length > 0 ? floors[0] : null;
              
              if (firstFloor) {
                const firstFloorRooms = spaces.filter(space => 
                  space.geometries && 
                  space.geometries[0] && 
                  space.geometries[0].floor === firstFloor.id
                );
                
                if (firstFloorRooms.length > 0) {
                  bestRoom = firstFloorRooms[0];
                  console.log('Using default room on first floor:', bestRoom.name);
                } else {
                  bestRoom = spaces[0];
                  console.log('Using first available space:', bestRoom.name);
                }
              } else {
                bestRoom = spaces[0];
                console.log('Using first available space:', bestRoom.name);
              }
            } catch (error) {
              console.error('Error finding rooms on first floor:', error);
              bestRoom = spaces[0];
              console.log('Fallback to first available space');
            }
          }
        }
        
        // Create and return the indoor location
        if (matchingBuilding && matchingMapId) {
          const indoorLocation: MappedInLocation = {
            title: `${matchingBuilding.abbreviation || ''} ${bestRoom ? bestRoom.name : roomCode}`.trim(),
            address: matchingBuilding.address || 'No Address',
            image: matchingBuilding.image || 'assets/images/poi_fail.png',
            indoorMapId: matchingMapId,
            room: bestRoom || roomCode,
            buildingCode: matchingBuilding.abbreviation || '',
            roomName: bestRoom ? bestRoom.name : roomCode,
            coordinates: matchingBuilding.coordinates,
            type: 'indoor'
          };
          
          console.log('Created indoor location:', indoorLocation);
          return indoorLocation;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding indoor location:', error);
      return null;
    }
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
      // First clear any existing routes
      try {
        // Clear previous navigation if it exists
        await this.outdoorDirectionsService.clearNavigation();
        await this.indoorDirectionService.clearNavigation();
      } catch (clearError) {
        console.warn('Error clearing previous routes:', clearError);
      }
      
      // Get current location with fallback enabled
      const position = await this.currentLocationService.getCurrentLocation(true);
      if (!position) {
        console.error('Unable to get current location, despite fallback');
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
      console.log('Original destination:', destination);
      
      // Validate destination
      if (!destination) {
        throw new Error('Destination is undefined or null');
      }
      
      // Make sure destination has valid coordinates
      if (!destination.coordinates || 
          !destination.coordinates.lat || 
          typeof destination.coordinates.lat !== 'function') {
        console.warn('Invalid destination coordinates - attempting to fix', destination.coordinates);
        
        // Try to fix the coordinates if they're strings or numbers
        if (destination.coordinates && 
            (typeof destination.coordinates.lat === 'string' || 
             typeof destination.coordinates.lat === 'number') &&
            (typeof destination.coordinates.lng === 'string' || 
             typeof destination.coordinates.lng === 'number')) {
          try {
            destination.coordinates = new google.maps.LatLng(
              parseFloat(destination.coordinates.lat), 
              parseFloat(destination.coordinates.lng)
            );
            console.log('Fixed coordinates:', destination.coordinates);
          } catch (coordError) {
            console.error('Failed to create LatLng from coordinates:', coordError);
            throw new Error('Cannot create route with invalid coordinates');
          }
        } else {
          throw new Error('Cannot create route with invalid coordinates');
        }
      }

      // Set start points in both services
      this.outdoorDirectionsService.setStartPoint(startLocation);
      
      // Show start marker
      try {
        this.outdoorDirectionsService.showStartMarker();
      } catch (markerError) {
        console.warn('Error showing start marker:', markerError);
      }
      
      // For indoor destinations, try to find a better match using the room code
      let indoorDestination = null;
      if (destination.type === 'indoor') {
        // Extract room code or location
        const roomCode = destination.room || 
                         (typeof destination.title === 'string' && destination.title.split(' ').pop()) || 
                         '';
        
        // Find a better indoor location match
        if (roomCode) {
          indoorDestination = await this.findIndoorLocation(roomCode);
          
          if (indoorDestination) {
            console.log('Found better indoor location match:', indoorDestination);
            // Keep the original title and any other important info
            indoorDestination.title = destination.title || indoorDestination.title;
            // Use the better coordinates from the matched building
            destination.coordinates = indoorDestination.coordinates;
          } else {
            console.warn('Could not find better indoor location match, using original destination');
          }
        }
      }
      
      // Set destination based on type
      if (destination.type === 'indoor') {
        // Use the better indoor destination if found, otherwise use the original
        const finalIndoorDestination = indoorDestination || destination;
        
        // Set destination for indoor directions
        this.indoorDirectionService.setDestinationPoint(finalIndoorDestination);
        
        // Also set for outdoor to maintain consistency
        const outdoorDestination: GoogleMapLocation = {
          title: finalIndoorDestination.fullName || finalIndoorDestination.title,
          address: finalIndoorDestination.address || 'No Address',
          coordinates: finalIndoorDestination.coordinates,
          type: 'outdoor'
        };
        this.outdoorDirectionsService.setDestinationPoint(outdoorDestination);
        
        // Show destination marker
        try {
          this.outdoorDirectionsService.showDestinationMarker();
        } catch (markerError) {
          console.warn('Error showing destination marker:', markerError);
        }
        
        // If we have a match, set the proper map data
        if (indoorDestination && indoorDestination.indoorMapId) {
          try {
            await this.mappedInService.setMapData(indoorDestination.indoorMapId);
            console.log('Set map data to:', indoorDestination.indoorMapId);
          } catch (mapError) {
            console.error('Error setting map data:', mapError);
          }
        }
        
        // Set map type to indoor
        this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
        
        // Render indoor navigation
        try {
          await this.indoorDirectionService.renderNavigation();
        } catch (navError) {
          console.error('Error rendering indoor navigation, falling back to outdoor:', navError);
          // Fall back to outdoor
          this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
          
          // Try getting a walking route as fallback
          try {
            const strategy = await this.outdoorDirectionsService.getShortestRoute();
            if (strategy) {
              this.outdoorDirectionsService.setSelectedStrategy(strategy);
              this.outdoorDirectionsService.renderNavigation();
            }
          } catch (fallbackError) {
            console.error('Fallback to outdoor navigation failed:', fallbackError);
          }
        }
      } else {
        // Set destination for outdoor directions - this part is left unchanged as requested
        this.outdoorDirectionsService.setDestinationPoint(destination);
        
        // Show destination marker
        try {
          this.outdoorDirectionsService.showDestinationMarker();
        } catch (markerError) {
          console.warn('Error showing destination marker:', markerError);
        }
        
        // Set map type to outdoor
        this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
        
        // Get and render outdoor navigation
        try {
          const strategy = await this.outdoorDirectionsService.getShortestRoute();
          if (!strategy) {
            console.warn('No valid routing strategy found');
            return;
          }
          
          this.outdoorDirectionsService.setSelectedStrategy(strategy);
          this.outdoorDirectionsService.renderNavigation();
        } catch (routeError) {
          console.error('Error getting or rendering outdoor route:', routeError);
        }
      }
      
      // Show the route
      this.store.dispatch(setShowRoute({ show: true }));
    } catch (error) {
      console.error('Error creating route:', error);
      // Try to at least show the map without throwing
      try {
        this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
        this.store.dispatch(setShowRoute({ show: false }));
      } catch (recoveryError) {
        console.error('Failed to recover from routing error:', recoveryError);
      }
    }
  }
}
