import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum MapType {
  Indoor = 'INDOOR',
  Outdoor = 'OUTDOOR'
}

@Injectable({
  providedIn: 'root'
})
export class MapSwitcherService {
  private currentMapSubject = new BehaviorSubject<MapType>(MapType.Outdoor);
  currentMap$ = this.currentMapSubject.asObservable();

  switchMap(map: MapType) {
    this.currentMapSubject.next(map);
  }

  toggleMap() {
    const newMap = this.currentMapSubject.value === MapType.Outdoor ? MapType.Indoor : MapType.Outdoor;
    this.switchMap(newMap);
  }
}
