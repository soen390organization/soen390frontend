import { Injectable } from '@angular/core';
import { DirectionsService } from './directions.service';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapService {
  private map!: google.maps.Map;
  private apiLoaded = false;

  constructor(private directionsService: DirectionsService) {
    this.apiLoaded = true;
  }

  waitForApiLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.apiLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  setMap(map: google.maps.Map) {
    this.map = map;
    this.directionsService.initialize(map);
  }

  getMap(): google.maps.Map {
    return this.map;
  }

  updateMapLocation(location: google.maps.LatLng) {
    if (this.map) {
      this.map.setCenter(location);
      this.map.setZoom(18);
    }
  }
}
