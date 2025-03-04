import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getMapData, show3dMap, MapData, MapView } from '@mappedin/mappedin-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MappedinService {
  private mapView: MapView | undefined;
  
  private _isMappedin$ = new BehaviorSubject<boolean>(false);
  public isMappedin$ = this._isMappedin$.asObservable();

  async initializeMap(container: HTMLElement): Promise<void> {
    const options = {
      mapId: environment.mappedin.mapId,
      key: environment.mappedin.key,
      secret: environment.mappedin.secret,
    };
    const mapData: MapData = await getMapData(options);
    this.mapView = await show3dMap(container, mapData);
  }  
}
