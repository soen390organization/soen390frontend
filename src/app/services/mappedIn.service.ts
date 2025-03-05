// mappedin.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getMapData, show3dMap, MapData, MapView } from '@mappedin/mappedin-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MappedinService {
  private mapView: MapView | undefined;
  
  private readonly _isMappedin$ = new BehaviorSubject<boolean>(false);
  public isMappedin$ = this._isMappedin$.asObservable();

  async initializeMap(container: HTMLElement): Promise<void> {
    const mapData = await this.getMapData();
    this.mapView = await this.show3dMap(container, mapData);
  }

  /**
   * Protected method that wraps the external getMapData API call.
   * Tests can override or spy on this method.
   */
  protected getMapData(): Promise<MapData> {
    return getMapData({
      mapId: environment.mappedin.mapId,
      key: environment.mappedin.key,
      secret: environment.mappedin.secret,
    });
  }

  /**
   * Protected method that wraps the external show3dMap API call.
   * Tests can override or spy on this method.
   */
  protected show3dMap(container: HTMLElement, mapData: MapData): Promise<MapView> {
    return show3dMap(container, mapData);
  }
}
