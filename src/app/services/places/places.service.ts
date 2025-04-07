import { Injectable } from '@angular/core';
import { Location } from '../../interfaces/location.interface';
import { selectSelectedCampus, AppState } from '../../store/app';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import { MappedinService, BuildingData } from '../mappedin/mappedin.service';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { ConcordiaDataService } from '../concordia-data.service';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private placesService!: google.maps.places.PlacesService;
  private readonly placesServiceReady = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly store: Store<AppState>,
    private readonly mappedInService: MappedinService,
    private readonly concordiaDataService: ConcordiaDataService
  ) {}

  /**
   * Initializes the PlacesService with a given Google Map instance.
   */
  public initialize(map: google.maps.Map): void {
    if (!this.placesService) {
      this.placesService = new google.maps.places.PlacesService(map);
      this.placesServiceReady.next(true);
    }
  }

  /**
   * Returns an observable that emits the readiness status of the PlacesService.
   */
  public isInitialized() {
    return this.placesServiceReady.asObservable();
  }

  /**
   * Retrieves place suggestions based on the input query.
   * If the input is empty, default building suggestions are returned from ConcordiaDataService.
   */
  public async getPlaceSuggestions(input: string): Promise<Location[]> {
    const trimmedInput = input.trim();
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));

    if (!trimmedInput) {
      // Use ConcordiaDataService to get the default building suggestions.
      return this.concordiaDataService.getBuildingSuggestions(campusKey);
    }

    // Get campus coordinates using our helper method.
    const campusCoordinates = this.getCampusCoordinates(campusKey);
    if (!campusCoordinates) {
      return [];
    }

    const autocompleteService = new google.maps.places.AutocompleteService();
    const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>(
      (resolve) => {
        autocompleteService.getPlacePredictions(
          {
            input,
            location: new google.maps.LatLng(45.5017, -73.5673), // Montreal coordinates
            radius: 10000 // Adjust radius as needed to cover the Montreal area
          },
          (predictions, status) => {
            resolve(predictions || []);
          }
        );
      }
    );

    let rooms = [];
    const campusDataFromMappedIn: Record<string, BuildingData> =
      this.mappedInService.getCampusMapData() || {};
    for (const [key, building] of Object.entries(campusDataFromMappedIn)) {
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
            room: space,
            type: 'indoor',
            icon: 'assets/icon/c-logo.png'
          })),
        ...building.mapData
          .getByType('point-of-interest')
          .filter((poi) => poi.name)
          .map((poi) => ({
            title: building.abbreviation + ' ' + poi.name,
            address: building.address,
            coordinates: building.coordinates,
            fullName: building.name + ' ' + poi.name,
            abbreviation: building.abbreviation,
            indoorMapId: key,
            room: poi,
            type: 'indoor'
          }))
      ];

      // Group POIs by name.
      const poiGroups: Record<string, any[]> = {};
      for (const poi of building.mapData.getByType('point-of-interest')) {
        if (poi.name) {
          if (!poiGroups[poi.name]) {
            poiGroups[poi.name] = [];
          }
          poiGroups[poi.name].push(poi);
        }
      }
      // Convert grouped POIs into final array format.
      for (const [poiName, pois] of Object.entries(poiGroups)) {
        rooms.push({
          title: building.abbreviation + ' ' + poiName,
          address: building.address,
          fullName: building.name + ' ' + poiName,
          abbreviation: building.abbreviation,
          indoorMapId: key,
          room: pois, // Now an array of POIs with the same name.
          type: 'indoor'
        });
      }
    }

    const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const searchTerm = normalizeString(input);

    const selectedBuildingRooms = rooms.filter((room) =>
      [room.title, room.fullName, room.abbreviation].some(
        (field) => field && normalizeString(field).includes(searchTerm)
      )
    );

    const detailsPromises = predictions.map((prediction) => this.getPlaceDetail(prediction));
    let details = await Promise.all(detailsPromises);
    details = [...selectedBuildingRooms.slice(0, 3), ...details];

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

  /**
   * Helper method to extract campus coordinates from the ConcordiaDataService.
   */
  private getCampusCoordinates(campusKey: string): { lat: number; lng: number } | undefined {
    const campus = this.concordiaDataService.getCampus(campusKey);
    return campus ? campus.coordinates : undefined;
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
   * Retrieves the buildings on the selected campus.
   * Delegates to ConcordiaDataService to obtain the buildings.
   */
  public async getCampusBuildings(): Promise<GoogleMapLocation[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));
    return this.concordiaDataService.getBuildings(campusKey).map((building: any) => ({
      title: building.name,
      coordinates: new google.maps.LatLng(building.coordinates),
      address: building.address,
      image: building.image,
      type: 'outdoor'
    }));
  }

  /**
   * Retrieves nearby points of interest (e.g., restaurants) around the selected campus.
   */
  public async getPointsOfInterest(): Promise<GoogleMapLocation[]> {
    const campusKey = await firstValueFrom(this.store.select(selectSelectedCampus));
    const campusCoordinates = this.getCampusCoordinates(campusKey);

    // If campusCoordinates is undefined, return an empty array or handle the error as needed.
    if (!campusCoordinates) {
      return [];
    }

    const places = await this.getPlaces(
      new google.maps.LatLng(campusCoordinates),
      250,
      'restaurant'
    ).catch(() => []); // Catch any error and return an empty array

    return places.map((place) => ({
      title: place.name ?? 'No name available',
      coordinates: place.geometry?.location as google.maps.LatLng,
      address: place.vicinity ?? 'No address available',
      image: place.photos[0]?.getUrl(),
      type: 'outdoor' as const
    }));
  }

  /**
   * Retrieves places from Google Places API based on location, radius, and type.
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
          reject(Error('error in getPlaces(): ' + status));
        }
      });
    });
  }
}
