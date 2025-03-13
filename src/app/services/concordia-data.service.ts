import { Injectable } from '@angular/core';
import data from 'src/assets/concordia-data.json';

@Injectable({
  providedIn: 'root'
})
export class ConcordiaDataService {
  constructor() {}

  getBuildings(campusKey: string) {
    return data[campusKey].buildings;
  }
}
