import { Injectable } from '@angular/core';
import { Location } from '../../interfaces/location.interface';
import data from 'src/assets/concordia-data.json';
import { selectSelectedCampus, AppState } from '../../store/app';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import { MappedinService, BuildingData } from '../mappedin/mappedin.service';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private placesService!: google.maps.places.PlacesService;
  private placesServiceReady = new BehaviorSubject<boolean>(false);
  private campusData: any = data;

  constructor(
    private readonly store: Store<AppState>,
    private mappedInService: MappedinService
  ) {}

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

  public async getPlaceSuggestions(input: string): Promise<Location[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));
    const campusCoordinates = this.campusData[campusKey]?.coordinates;
    if (!campusCoordinates) {
      return [];
    }

    const autocompleteService = new google.maps.places.AutocompleteService();
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>(
      (resolve) => {
        autocompleteService.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'CA' },
            locationBias: new google.maps.Circle({
              center: new google.maps.LatLng(campusCoordinates),
              radius: 500
            })
          },
          (predictions, status) => {
            resolve(predictions || []);
          }
        );
      }
    );

    const campusData = this.mappedInService.getCampusMapData() || {};
    let rooms = [];
    
    for (const [key, building] of Object.entries(campusData) as [string, BuildingData][]) {
      // Process 'space' types normally
      rooms = [
        ...rooms,
        ...building.mapData
          .getByType('space')
          .filter((space) => space.name)
          .map((space) => ({
            title: building.abbreviation + ' ' + space.name,
            address: building.address,
            coordinates: building.coordinates,
            fullName: building.name + ' ' + space.name,
            abbreviation: building.abbreviation,
            indoorMapId: key,
            room: space, // Single room object
            type: 'indoor'
          }))
      ];
    
      // Group POIs by name
      const poiGroups: Record<string, any[]> = {};
    
      for (const poi of building.mapData.getByType('point-of-interest')) {
        if (poi.name) {
          if (!poiGroups[poi.name]) {
            poiGroups[poi.name] = [];
          }
          poiGroups[poi.name].push(poi);
        }
      }
    
      // Convert grouped POIs into final array format
      for (const [poiName, pois] of Object.entries(poiGroups)) {
        rooms.push({
          title: building.abbreviation + ' ' + poiName,
          address: building.address,
          fullName: building.name + ' ' + poiName,
          abbreviation: building.abbreviation,
          indoorMapId: key,
          room: pois, // Now an array of POIs with the same name
          type: 'indoor'
        });
      }
    }

    const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const searchTerm = normalizeString(input);

    const selectedBuildingRooms = rooms.filter((room) =>
      [room.title, room.fullName, room.abbreviation] // Check abbreviation, full name, and short name
        .some((field) => field && normalizeString(field).includes(searchTerm))
    );

    const detailsPromises = predictions.map((prediction) => this.getPlaceDetail(prediction));
    let details = await Promise.all(detailsPromises);
    details = [...selectedBuildingRooms.slice(0, 3), ...details];

    // Filter out any null values (failed details)
    return details.filter(
      (
        detail
      ): detail is {
        title: string;
        address: string;
        coordinates: google.maps.LatLng;
        type: 'outdoor';
      } => detail !== null
    );
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
