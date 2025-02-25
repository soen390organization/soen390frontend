import { Injectable } from '@angular/core';
import { LocationCard } from '../interfaces/location-card.interface';
import data from 'src/assets/ConcordiaData.json';
import { selectSelectedCampus, AppState } from '../store/app';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private placesService!: google.maps.places.PlacesService;
  private placesServiceReady = new BehaviorSubject<boolean>(false);
  private campusData: any = data;
  
  constructor(private store: Store<AppState>) {}

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

  public async getPlaceSuggestions(input: string): Promise<{ title: string; address: string; coordinates: google.maps.LatLng }[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));
    
    if (!this.campusData[campusKey]?.coordinates) {
      return [];
    }
  
    return new Promise((resolve) => {
      let autocompleteService = new google.maps.places.AutocompleteService();
  
      autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "CA" },
          locationBias: new google.maps.Circle({
            center: new google.maps.LatLng(this.campusData[campusKey]?.coordinates),
            radius: 500,
          }),
        },
        async (predictions, status) => {
          if (status !== "OK" || !predictions) {
            return resolve([]);
          }
  
          const placeDetailsPromises = predictions.map((prediction) =>
            new Promise<{ title: string; address: string; coordinates: google.maps.LatLng }>((detailResolve) => {
              this.placesService.getDetails(
                { placeId: prediction.place_id, fields: ["geometry", "formatted_address", "address_components"] },
                (place, detailsStatus) => {
                  if (detailsStatus === "OK" && place?.geometry?.location) {
                    detailResolve({
                      title: prediction.structured_formatting.main_text,
                      address: place.formatted_address,
                      coordinates: new google.maps.LatLng({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                      }),
                    });
                  }
                }
              );
            })
          );
  
          const results = await Promise.all(placeDetailsPromises);
          resolve(results);
        }
      );
    });
  }  

  /**
   * Retrieves the buildings on the selected campus from the store.
   * @returns A promise resolving to an array of LocationCard objects representing campus buildings.
   */
  public async getCampusBuildings(): Promise<LocationCard[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));

    return this.campusData[campusKey].buildings.map((building: LocationCard) => ({
      name: building.name,
      coordinates: new google.maps.LatLng(building.coordinates),
      address: building.address,
      image: building.image
    }));
  }
  
  /**
   * Retrieves nearby points of interest (e.g., restaurants) around the selected campus.
   * Defaults to the current campus location but can be enhanced to prioritize the user's location.
   * @TODO - Modify to prioritize the user's location if they are on campus.
   * @returns A promise resolving to an array of LocationCard objects representing points of interest.
   */
  public async getPointsOfInterest(): Promise<LocationCard[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));
    
    const places = await this.getPlaces(this.campusData[campusKey]?.coordinates, 250, 'restaurant')
      .catch(() => []); // Catch any error and return an empty array

    return places.map(place => ({
      name: place.name ?? 'No name available',
      coordinates: place.geometry?.location as google.maps.LatLng, 
      address: place.vicinity ?? 'No address available',
      image: place.photos?.[0]?.getUrl() ?? 'default-image-url.jpg'
    }));
  }  

  /**
   * Retrieves places from Google Places API based on location, radius, and type.
   * @param location The center point of the search.
   * @param radius The search radius in meters.
   * @param type The type of place to search for.
   * @returns A promise resolving to an array of PlaceResult objects.
   */
  private getPlaces(location: google.maps.LatLng, radius: number, type: string): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {  
      const request: google.maps.places.PlaceSearchRequest = {
        location,
        radius,
        type
      };
  
      this.placesService.nearbySearch(request, (results, status) => {
        if (status === "OK" && results) {
          const operationalResults = results.filter(place => 
            place.business_status === 'OPERATIONAL'
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