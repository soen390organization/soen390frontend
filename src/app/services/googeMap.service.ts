import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapService {
  private map!: google.maps.Map;
  private apiLoaded = false;

  constructor() {
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

  createMarker(
    position: google.maps.LatLng,
    iconUrl: string
  ): google.maps.Marker {
    return new google.maps.Marker({
      position,
      map: this.map,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(40, 40) }
    });
  }
}
