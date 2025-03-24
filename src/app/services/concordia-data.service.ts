import { Injectable } from '@angular/core';
import data from 'src/assets/concordia-data.json';

@Injectable({
  providedIn: 'root'
})
export class ConcordiaDataService {
  addressMap: Map<string, string>;
  coordinatesMap: Map<string, {lat: string, lng: string}>;
  imageMap: Map<string, string>
  constructor() { 
    this.addressMap = this.createAbbreviationToAddressMap();
    this.coordinatesMap = this.createAbbreviationToCoordinatesMap();
    this.imageMap = this.createAbbreviationToImageMap();
  }

  getBuildings(campusKey: string) {
    return data[campusKey].buildings;
  }

  createAbbreviationToAddressMap() {
    var map = new Map<string, string>;
    Object.values(data).forEach(campus => {
      campus.buildings.forEach(building => {
        map[building.abbreviation] = building.address;
      });
    });
    return map;
  }

  createAbbreviationToCoordinatesMap() {
    var map = new Map<string, {lat: string, lng: string}>;
    Object.values(data).forEach(campus => {
      campus.buildings.forEach(building => {
        var coordsObj = {lat: building.coordinates.lat, lng: building.coordinates.lng}
        map[building.abbreviation] = coordsObj;
      });
    });
    return map;
  }

  createAbbreviationToImageMap() {
    var map = new Map<string, string>;
    Object.values(data).forEach(campus => {
      campus.buildings.forEach(building => {
        map[building.abbreviation] = building.image;
      });
    });
    return map;
  }
}
