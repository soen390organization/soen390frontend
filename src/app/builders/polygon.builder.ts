import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PolygonBuilder {
  map!: google.maps.Map;
  latLngCoords: google.maps.LatLngLiteral[] = [];

  setMap(map: google.maps.Map) {
    this.map = map;
    return this;
  }

  setLatLng(latLng: google.maps.LatLngLiteral) {
    if (!this.latLngCoords) {
      this.latLngCoords = [];
    }
    this.latLngCoords.push(latLng);
    return this;
  }

  build() {
    return new google.maps.Polygon({
      paths: this.latLngCoords,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
    }).setMap(this.map);
  }
}
