import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PolygonBuilder {
  map!: google.maps.Map;
  latLngCoords: google.maps.LatLngLiteral[] = [];
  fill: string = '#FF0000';
  outline: string = '#FF0000';

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

  setFillOutlineColor(fill: string, outline: string) {
    this.fill = fill;
    this.outline = outline;
  }

  build() {
    return new google.maps.Polygon({
      paths: this.latLngCoords,
      strokeColor: this.outline,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: this.fill,
      fillOpacity: 0.35,
    }).setMap(this.map);
  }
}
