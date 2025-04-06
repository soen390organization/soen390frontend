import { Injectable } from '@angular/core';
import data from 'src/assets/concordia-data.json';
export type Campus = (typeof data)[keyof typeof data];

@Injectable({
  providedIn: 'root'
})
export class ConcordiaDataService {
  addressMap: Map<string, string>;
  coordinatesMap: Map<string, { lat: string; lng: string }>;
  imageMap: Map<string, string>;
  /* @TODO: We can have a better solution for this */
  private readonly highlightedBuildings = new Set<string>([
    'H Building Concordia University',
    'John Molson School of Business',
    'Concordia University, John Molson Building',
    'Concordia Engineering And Visual Arts (EV) Building',
    'Pavillon Ev Building',
    'LB Building, Concordia University',
    'CL Annex',
    'Concordia University ER Building',
    'Vanier Library',
    'Central Building (CC)',
    'SP Building, Loyola Campus, Concordia University',
    'Engineering and Visual Arts',
    'ER Building',
    'Webster Library',
    'Hall',
    '3 Amigos Building',
    'Hall Building Auditorium',
    'Central Building',
    'Richard J. Renaud Science Complex',
    'Vanier Extension'
  ]);

  constructor() {
    this.addressMap = this.createAbbreviationToAddressMap();
    this.coordinatesMap = this.createAbbreviationToCoordinatesMap();
    this.imageMap = this.createAbbreviationToImageMap();
  }

  public getCampus(campusKey: string) {
    return data[campusKey];
  }

  public getBuildings(campusKey: string) {
    return data[campusKey].buildings;
  }

  public getBuildingSuggestions(campusKey: string) {
    return this.getBuildings(campusKey).map((building: any) => ({
      title: building.name,
      address: building.address,
      coordinates: new google.maps.LatLng(building.coordinates),
      type: 'outdoor'
    }));
  }

  public getNearestCampus(coords: google.maps.LatLng): Campus {
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

  getHighlightedBuildings(): Set<string> {
    return this.highlightedBuildings;
  }

  createAbbreviationToAddressMap() {
    let map = new Map<string, string>();
    Object.values(data).forEach((campus) => {
      campus.buildings.forEach((building) => {
        map[building.abbreviation] = building.address;
      });
    });
    return map;
  }

  createAbbreviationToCoordinatesMap() {
    let map = new Map<string, { lat: string; lng: string }>();
    Object.values(data).forEach((campus) => {
      campus.buildings.forEach((building) => {
        var coordsObj = { lat: building.coordinates.lat, lng: building.coordinates.lng };
        map[building.abbreviation] = coordsObj;
      });
    });
    return map;
  }

  createAbbreviationToImageMap() {
    let map = new Map<string, string>();
    Object.values(data).forEach((campus) => {
      campus.buildings.forEach((building) => {
        map[building.abbreviation] = building.image;
      });
    });
    return map;
  }
}
