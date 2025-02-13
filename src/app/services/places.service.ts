import { Injectable } from '@angular/core';
import { LocationCard } from '../interfaces/location-card.interface';
import data from 'src/assets/ConcordiaData.json';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private placesService!: google.maps.places.PlacesService;

  /**
   * Initializes the PlacesService with a given Google Map instance.
   * @param map The Google Map instance to associate with the PlacesService.
   */
  public initialize(map: google.maps.Map): void {
    if (!this.placesService)
      this.placesService = new google.maps.places.PlacesService(map);
  }

  public async getCampusBuildings(campus: string) {
  }
  
  /**
   * Retrieves points of interest (restaurants) near a specified location.
   * @param location The geographical location to search around.
   * @returns A promise resolving to an array of LocationCard objects.
   */
  public async getPointsOfInterest(location: google.maps.LatLng): Promise<LocationCard[]> {
    const places = await this.getPlaces(location, 250, 'restaurant');
  
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
      if (!this.placesService) {
        console.error('PlacesService not initialized. Call setMap() first.');
        reject('PlacesService not initialized.');
        return;
      }
  
      const request: google.maps.places.PlaceSearchRequest = {
        location,
        radius,
        type
      };
  
      this.placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
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