import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapService {
  private map!: google.maps.Map;
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;
  private apiLoaded = false;

  constructor() {
    this.loadGoogleMaps().then(() => {
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.apiLoaded = true;
    });
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
      } else {
        window.onload = () => {
          if (typeof google !== 'undefined' && google.maps) {
            resolve();
          } else {
            reject('Google Maps API failed to load.');
          }
        };
      }
    });
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

  getDirectionsService(): google.maps.DirectionsService {
    return this.directionsService;
  }

  getDirectionsRenderer(): google.maps.DirectionsRenderer {
    return this.directionsRenderer;
  }

  updateMapLocation(location: google.maps.LatLng) {
    if (this.map) {
      this.map.setCenter(location);
      this.map.setZoom(18);
    }
  }
}
