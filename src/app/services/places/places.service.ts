import { Injectable } from '@angular/core';
import { Location } from '../../interfaces/location.interface';
import data from 'src/assets/concordia-data.json';
import buildingMappingsData from 'src/assets/building-mappings.json';
import { selectSelectedCampus, AppState } from '../../store/app';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import { MappedinService, BuildingData } from '../mappedin/mappedin.service';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';

// Building name mappings for common search terms
interface BuildingMapping {
  [key: string]: string[];
}

// Building priority match interface
interface PriorityBuilding {
  title: string;
  address: string;
  coordinates: {lat: number, lng: number};
  campusKey: string;
}

interface PriorityBuildingMapping {
  [key: string]: PriorityBuilding;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private placesService!: google.maps.places.PlacesService;
  private placesServiceReady = new BehaviorSubject<boolean>(false);
  private campusData: any = data;
  
  // Mappings loaded from external file
  private buildingMappings: BuildingMapping = {};
  private priorityMatches: PriorityBuildingMapping = {};

  constructor(
    private readonly store: Store<AppState>,
    private mappedInService: MappedinService
  ) {
    // Load mappings from external JSON file
    this.loadBuildingMappings();
    
    // Generate additional mapping entries based on building abbreviations
    this.enhanceBuildingMappings();
  }
  
  /**
   * Loads building mappings from the external JSON file
   */
  private loadBuildingMappings(): void {
    // Load aliases 
    this.buildingMappings = (buildingMappingsData as any).aliases || {};
    
    // Load priority matches
    this.priorityMatches = (buildingMappingsData as any).priorityMatches || {};
  }
  
  /**
   * Enhances the building mappings by adding entries based on the building data
   * This ensures that new buildings added to concordia-data.json are automatically mapped
   */
  private enhanceBuildingMappings(): void {
    // Process both campuses
    ['sgw', 'loy'].forEach(campusKey => {
      const buildings = this.campusData[campusKey]?.buildings || [];
      
      buildings.forEach((building: any) => {
        // Add mapping for abbreviation if not already in mappings
        if (building.abbreviation) {
          const abbr = building.abbreviation.toLowerCase();
          if (!this.buildingMappings[abbr]) {
            this.buildingMappings[abbr] = [building.name];
          } else if (!this.buildingMappings[abbr].includes(building.name)) {
            this.buildingMappings[abbr].push(building.name);
          }
        }
        
        // Add mapping for name words
        const nameWords = building.name.toLowerCase().split(' ');
        nameWords.forEach(word => {
          if (word.length > 2) { // Skip very short words
            if (!this.buildingMappings[word]) {
              this.buildingMappings[word] = [building.name];
            } else if (!this.buildingMappings[word].includes(building.name)) {
              this.buildingMappings[word].push(building.name);
            }
          }
        });
      });
    });
  }

  /**
   * Initializes the PlacesService with a given Google Map instance.
   * @param map The Google Map instance to associate with the PlacesService.
   */
  public initialize(map: google.maps.Map): void {
    if (!this.placesService) {
      this.placesService = new google.maps.places.PlacesService(map);
      this.placesServiceReady.next(true);
    }
  }

  /**
   * Returns an observable that emits the readiness status of the PlacesService.
   * This can be used to ensure the service is initialized before making API calls.
   * @returns An observable emitting a boolean indicating whether the PlacesService is ready.
   */
  public isInitialized() {
    return this.placesServiceReady.asObservable();
  }

  /**
   * Gets building suggestions that match the search term based on the mapping
   * @param searchTerm The search term
   * @param campusKey The current campus key (sgw or loy)
   * @returns An array of building locations that match the search term
   */
  private getBuildingSuggestions(searchTerm: string, campusKey: string): GoogleMapLocation[] {
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    if (!normalizedSearchTerm) return [];
    
    // For different match priorities
    const matchedBuildingNames = this.findMatchingBuildingNames(normalizedSearchTerm);
    if (matchedBuildingNames.length === 0) return [];
    
    // Create mapping for campus buildings for quick lookup
    const campusBuildings = this.campusData[campusKey].buildings;
    const suggestions: GoogleMapLocation[] = [];
    const addedNames = new Set<string>();
    
    // Special processing for abbreviation matches
    if (normalizedSearchTerm.length <= 3) {
      this.addExactAbbreviationMatches(normalizedSearchTerm, campusBuildings, suggestions, addedNames);
    }
    
    // Process matched building names and convert to location objects
    this.addBuildingNameMatches(matchedBuildingNames, campusBuildings, suggestions, addedNames);
    
    return suggestions;
  }
  
  /**
   * Finds building names that match the search term using different matching strategies
   * @param searchTerm The normalized search term
   * @returns Array of matching building names with priority ordering
   */
  private findMatchingBuildingNames(searchTerm: string): string[] {
    const exactMatches: string[] = [];
    const startsWithMatches: string[] = [];
    const containsMatches: string[] = [];
    const isShortAbbreviation = searchTerm.length <= 3;
    
    // Find matches in building mappings with different priorities
    Object.entries(this.buildingMappings).forEach(([key, buildingNames]) => {
      if (key === searchTerm) {
        // Exact match (highest priority)
        exactMatches.push(...buildingNames);
      } else if (key.startsWith(searchTerm)) {
        // Key starts with search term (high priority)
        startsWithMatches.push(...buildingNames);
      } else if (!isShortAbbreviation && searchTerm.includes(key) && key.length > 1) {
        // Search term contains the key (medium priority) - only for longer queries
        containsMatches.push(...buildingNames);
      }
    });
    
    // Combine all matches with prioritization - exact matches first
    return [...new Set([...exactMatches, ...startsWithMatches, ...containsMatches])];
  }
  
  /**
   * Adds buildings that exactly match the abbreviation
   */
  private addExactAbbreviationMatches(
    searchTerm: string, 
    buildings: any[], 
    results: GoogleMapLocation[], 
    addedNames: Set<string>
  ): void {
    // Check for exact abbreviation match
    const abbreviationMatch = buildings.find(b => 
      b.abbreviation && b.abbreviation.toLowerCase() === searchTerm
    );
    
    if (abbreviationMatch) {
      results.push(this.buildingToLocation(abbreviationMatch));
      addedNames.add(abbreviationMatch.name);
    }
  }
  
  /**
   * Adds buildings matching the building names to the results
   */
  private addBuildingNameMatches(
    buildingNames: string[], 
    buildings: any[], 
    results: GoogleMapLocation[], 
    addedNames: Set<string>
  ): void {
    for (const name of buildingNames) {
      const building = buildings.find(b => {
        const bName = b.name.toLowerCase();
        const searchName = name.toLowerCase();
        
        return bName === searchName || 
               bName.includes(searchName) || 
               searchName.includes(bName);
      });
      
      if (building && !addedNames.has(building.name)) {
        results.push(this.buildingToLocation(building));
        addedNames.add(building.name);
      }
    }
  }
  
  /**
   * Converts a building object to a GoogleMapLocation
   */
  private buildingToLocation(building: any): GoogleMapLocation {
    return {
      title: building.name,
      address: building.address,
      coordinates: new google.maps.LatLng(building.coordinates),
      image: building.image,
      type: 'outdoor'
    };
  }

  /**
   * Get buildings that exactly match the input from concordia-data.json
   * This is for finding precise matches from the current campus.
   * 
   * @param input User's search input
   * @param campusKey Current campus
   * @returns The matching building locations
   */
  private getExactBuildingMatch(input: string, campusKey: string): GoogleMapLocation[] {
    const normalizedInput = input.toLowerCase().trim();
    if (!normalizedInput) return [];
    
    const campusBuildings = this.campusData[campusKey].buildings;
    const results: GoogleMapLocation[] = [];
    
    // Check for buildings with matching abbreviation (highest priority)
    const abbreviationMatches = campusBuildings.filter(b => 
      b.abbreviation && b.abbreviation.toLowerCase() === normalizedInput
    );
    
    if (abbreviationMatches.length > 0) {
      return abbreviationMatches.map(building => this.buildingToLocation(building));
    }
    
    // Check for direct alias matches in our mapping
    if (this.buildingMappings[normalizedInput]) {
      const buildingNames = this.buildingMappings[normalizedInput];
      const addedNames = new Set<string>();
      
      // Find buildings that match the alias names
      for (const name of buildingNames) {
        const building = campusBuildings.find(b => {
          const bName = b.name.toLowerCase();
          const searchName = name.toLowerCase();
          
          return bName === searchName || 
                 bName.includes(searchName) || 
                 searchName.includes(bName);
        });
        
        if (building && !addedNames.has(building.name)) {
          results.push(this.buildingToLocation(building));
          addedNames.add(building.name);
        }
      }
    }
    
    return results;
  }

  /**
   * Hard-coded building lookup for problematic abbreviations
   * @param input User input
   * @param campusKey Current campus key
   * @returns Building location if found, or null
   */
  /**
   * Direct lookup for problematic abbreviations
   * This forces specific buildings to be returned for certain abbreviations regardless of campus
   * @param input User's search input
   * @returns Building location for high-priority matches, or null if not a priority term
   */
  private getDirectBuildingMatch(input: string): GoogleMapLocation | null {
    const normalizedInput = input.toLowerCase().trim();
    const problematicTerms = (buildingMappingsData as any).problematicTerms || [];
    
    // Only process if this is identified as a problematic term
    if (!problematicTerms.includes(normalizedInput)) {
      return null;
    }
    
    // Look up the priority match from the external data
    const priorityMatch = this.priorityMatches[normalizedInput];
    
    if (priorityMatch) {
      // Always return the correct building regardless of current campus
      return {
        title: priorityMatch.title,
        address: priorityMatch.address,
        coordinates: new google.maps.LatLng(priorityMatch.coordinates),
        type: 'outdoor'
      };
    }
    
    return null;
  }

  /**
   * Get room matches from MappedIn service
   * @param searchTerm The normalized search term
   * @returns List of matching rooms
   */
  private getRoomMatches(searchTerm: string): MappedInLocation[] {
    const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    let rooms: MappedInLocation[] = [];
    
    // Get campus data from MappedIn service
    const campusData = this.mappedInService.getCampusMapData() || {};
    
    // Process each building
    for (const [key, building] of Object.entries(campusData) as [string, BuildingData][]) {
      // Add spaces (rooms)
      const spaces = building.mapData
        .getByType('space')
        .filter(space => space.name)
        .map(space => this.createRoomLocation(building, key, space));
        
      // Add points of interest
      const pois = building.mapData
        .getByType('point-of-interest')
        .filter(poi => poi.name)
        .map(poi => this.createRoomLocation(building, key, poi));
        
      // Add all to rooms array
      rooms = [...rooms, ...spaces, ...pois];
    }
    
    // Filter rooms by search term and limit to top 3
    return rooms
      .filter(room => {
        const roomWithFullName = room as MappedInLocation & { fullName: string, abbreviation: string };
        return [room.title, roomWithFullName.fullName, roomWithFullName.abbreviation]
          .some(field => field && normalizeString(field).includes(searchTerm));
      })
      .slice(0, 3);
  }
  
  /**
   * Create a room location object from MappedIn data
   * Uses a combination of MappedInLocation and GoogleMapLocation interfaces
   */
  private createRoomLocation(
    building: BuildingData, 
    mapId: string, 
    space: any
  ): any {
    // Using any here since we're combining multiple interfaces with extra properties
    return {
      title: building.abbreviation + ' ' + space.name,
      address: building.address,
      coordinates: building.coordinates,
      fullName: building.name + ' ' + space.name,
      abbreviation: building.abbreviation,
      indoorMapId: mapId,
      room: space,
      type: 'indoor'
    };
  }
  
  /**
   * Get Google place suggestions
   * @param input The original search input
   * @param campusCoordinates The coordinates of the current campus
   * @returns List of GoogleMapLocation objects
   */
  private async getGoogleSuggestions(
    input: string, 
    campusCoordinates: google.maps.LatLng
  ): Promise<GoogleMapLocation[]> {
    const autocompleteService = new google.maps.places.AutocompleteService();
    
    // Get predictions from Google Places API
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>(
      (resolve) => {
        autocompleteService.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'CA' },
            locationBias: new google.maps.Circle({
              center: campusCoordinates,
              radius: 500
            })
          },
          (predictions, status) => {
            resolve(predictions || []);
          }
        );
      }
    );
    
    // Get details for each prediction
    const detailsPromises = predictions.map(prediction => this.getPlaceDetail(prediction));
    const details = await Promise.all(detailsPromises);
    
    // Filter out null results
    return details.filter(detail => detail !== null) as GoogleMapLocation[];
  }
  
  /**
   * Combine building matches from exact and broader search
   */
  private combineBuildingMatches(input: string, campusKey: string): GoogleMapLocation[] {
    const exactMatches = this.getExactBuildingMatch(input, campusKey);
    const suggestions = this.getBuildingSuggestions(input, campusKey);
    
    // Use a Set to track which buildings we've already included
    const uniqueTitles = new Set(exactMatches.map(b => b.title));
    const allMatches = [...exactMatches];
    
    // Add suggestions that aren't already included
    for (const building of suggestions) {
      if (!uniqueTitles.has(building.title)) {
        allMatches.push(building);
        uniqueTitles.add(building.title);
      }
    }
    
    return allMatches;
  }

  /**
   * Main method to get place suggestions for the input
   * @param input User's search input
   * @returns List of location suggestions ordered by priority
   */
  public async getPlaceSuggestions(input: string): Promise<Location[]> {
    // Get current campus information
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));
    const campusCoordinates = this.campusData[campusKey]?.coordinates;
    if (!campusCoordinates) return [];

    const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const searchTerm = normalizeString(input);
    const inputLower = input.toLowerCase().trim();
    
    // Step 1: Check for priority matches that need special handling
    const priorityMatch = this.getDirectBuildingMatch(inputLower);
    if (priorityMatch) {
      return [priorityMatch]; // Return ONLY priority match if found
    }
    
    // Step 2: Handle abbreviations specially - buildings only, no rooms or Google
    if (inputLower.length <= 3) {
      // Try exact building match first
      const exactMatches = this.getExactBuildingMatch(inputLower, campusKey);
      if (exactMatches.length > 0) {
        return exactMatches;
      }
      
      // Then try broader building suggestions
      const buildingSuggestions = this.getBuildingSuggestions(inputLower, campusKey);
      if (buildingSuggestions.length > 0) {
        return buildingSuggestions;
      }
    }
    
    // Step 3: For non-abbreviations, combine all types of results
    // Get building matches with merged duplicates
    const buildingMatches = this.combineBuildingMatches(inputLower, campusKey);
    
    // Get matching rooms
    const roomMatches = this.getRoomMatches(searchTerm);
    
    // Get Google suggestions, but only if:
    // - Input is not an abbreviation, OR
    // - We don't have any building or room matches
    let googleMatches: GoogleMapLocation[] = [];
    if (inputLower.length > 3 || (buildingMatches.length === 0 && roomMatches.length === 0)) {
      googleMatches = await this.getGoogleSuggestions(input, campusCoordinates);
    }
    
    // Combine results in priority order:
    // 1. Building matches
    // 2. Room matches
    // 3. Google matches
    return [
      ...buildingMatches,
      ...roomMatches,
      ...googleMatches
    ].filter(match => match !== null);
  }

  private getPlaceDetail(
    prediction: google.maps.places.AutocompletePrediction
  ): Promise<GoogleMapLocation | null> {
    return new Promise((resolve) => {
      this.placesService.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['geometry', 'formatted_address', 'address_components']
        },
        (place, status) => {
          if (status === 'OK' && place?.geometry?.location) {
            resolve({
              title: prediction.structured_formatting.main_text,
              address: place.formatted_address,
              coordinates: new google.maps.LatLng({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }),
              type: 'outdoor'
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Retrieves the buildings on the selected campus from the store.
   * @returns A promise resolving to an array of LocationCard objects representing campus buildings.
   */
  public async getCampusBuildings(): Promise<GoogleMapLocation[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));

    return this.campusData[campusKey].buildings.map((building: any) => ({
      title: building.name,
      coordinates: new google.maps.LatLng(building.coordinates),
      address: building.address,
      image: building.image,
      type: 'outdoor'
    }));
  }

  /**
   * Retrieves nearby points of interest (e.g., restaurants) around the selected campus.
   * Defaults to the current campus location but can be enhanced to prioritize the user's location.
   * @TODO - Modify to prioritize the user's location if they are on campus.
   * @returns A promise resolving to an array of LocationCard objects representing points of interest.
   */
  public async getPointsOfInterest(): Promise<GoogleMapLocation[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));

    const places = await this.getPlaces(
      this.campusData[campusKey]?.coordinates,
      250,
      'restaurant'
    ).catch(() => []); // Catch any error and return an empty array

    return places.map((place) => ({
      title: place.name ?? 'No name available',
      coordinates: place.geometry?.location as google.maps.LatLng,
      address: place.vicinity ?? 'No address available',
      image: place.photos[0]?.getUrl(),
      type: 'outdoor' as 'outdoor'
    }));
  }

  /**
   * Retrieves places from Google Places API based on location, radius, and type.
   * @param location The center point of the search.
   * @param radius The search radius in meters.
   * @param type The type of place to search for.
   * @returns A promise resolving to an array of PlaceResult objects.
   */
  private getPlaces(
    location: google.maps.LatLng,
    radius: number,
    type: string
  ): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location,
        radius,
        type
      };

      this.placesService.nearbySearch(request, (results, status) => {
        if (status === 'OK' && results) {
          const operationalResults = results.filter(
            (place) => place.business_status === 'OPERATIONAL'
          );

          resolve(operationalResults);
        } else {
          console.error('Failed to get places:', status);
          reject(status);
        }
      });
    });
  }
}
