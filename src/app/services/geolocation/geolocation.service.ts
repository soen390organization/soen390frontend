/// <reference types="google.maps" />
import { Injectable } from '@angular/core';
import data from 'src/assets/concordia-data.json';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  constructor() {}

  public async getCurrentBuilding(
    currentLocation: {
      lat: number;
      lng: number;
    } | null
  ): Promise<string | null> {
    if (currentLocation == null) {
      return null;
    }
    const buildings = [...data.sgw.buildings, ...data.loy.buildings];

    const foundBuilding = buildings.find((building) => {
      const outline = new google.maps.Polygon({ paths: building.boundaries });
      const point = new google.maps.LatLng(currentLocation);
      return google.maps.geometry.poly.containsLocation(point, outline);
    });

    return foundBuilding ? foundBuilding.name : null;
  }
}
