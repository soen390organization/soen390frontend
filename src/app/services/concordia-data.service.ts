import { Injectable } from '@angular/core';
import data from 'src/assets/concordia-data.json';

@Injectable({
  providedIn: 'root'
})
export class ConcordiaDataService {
  constructor() {}

  getCampus(campusKey: string) {
    return data[campusKey];
  }

  getBuildings(campusKey: string) {
    return data[campusKey].buildings;
  }

  public getNearestCampus(coords: google.maps.LatLng) {
    const distanceToSGW = Math.sqrt(
      Math.pow(coords.lat() - data.sgw.coordinates.lat, 2) +
        Math.pow(coords.lng() - data.sgw.coordinates.lng, 2)
    );
    const distanceToLOY = Math.sqrt(
      Math.pow(coords.lat() - data.loy.coordinates.lat, 2) +
        Math.pow(coords.lng() - data.loy.coordinates.lng, 2)
    );

    return distanceToSGW < distanceToLOY ? data.sgw : data.loy;
  }
}
