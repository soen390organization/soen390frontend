import { Injectable } from '@angular/core';
import { PlacesService } from './places/places.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapService {
  private map!: google.maps.Map;
  private googlePlacesService!: google.maps.places.PlacesService;

  constructor(
    private readonly placesService: PlacesService
  ) {}

  initialize(map: google.maps.Map) {
    this.map = map;
    this.googlePlacesService = new google.maps.places.PlacesService(map);
    this.placesService.initialize(this.map);
  }

  public getMap(): google.maps.Map {
    return this.map;
  }

  updateMapLocation(location: google.maps.LatLng) {
    if (this.map) {
      this.map.setCenter(location);
      this.map.setZoom(18);
    }
  }

  createMarker(position: google.maps.LatLng, iconUrl: string): google.maps.Marker {
    return new google.maps.Marker({
      position,
      map: this.map,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(40, 40) }
    });
  }

  getCoordsFromAddress(query: string): Promise<google.maps.LatLng | null> {
    return new Promise((resolve, reject) => {
      this.googlePlacesService.findPlaceFromQuery(
        { query, fields: ['geometry', 'formatted_address'] },
        (results: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            resolve(results[0].geometry.location);
          } else {
            reject(new Error('Error finding coords'));
          }
        }
      );
    });
  }
}
