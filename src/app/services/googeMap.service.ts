import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapService {
  private map!: google.maps.Map;

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
}
