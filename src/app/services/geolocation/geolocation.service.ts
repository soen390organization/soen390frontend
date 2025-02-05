import { Injectable } from '@angular/core';
import data from 'src/assets/ConcordiaData.json';

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  constructor() { }

  public async getCurrentBuilding(currentLocation: { lat: number; lng: number; }): Promise<string | null> {
    const foundBuilding = data.buildings.find((building) => {
      // if we need a buffer on the outline it should be implemented here
      const outline = new google.maps.Polygon({ paths: building.boundaries });
      const point = new google.maps.LatLng(currentLocation);
      return google.maps.geometry.poly.containsLocation(point, outline);
    });

    return foundBuilding ? foundBuilding.name : null;
  }
}
