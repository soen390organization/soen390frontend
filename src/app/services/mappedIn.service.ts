import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getMapData, show3dMap, MapData, MapView } from '@mappedin/mappedin-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MappedinService {
  private mapView: MapView | undefined;
  private initialized = false;

  private _isMappedin$ = new BehaviorSubject<boolean>(false);
  public isMappedin$ = this._isMappedin$.asObservable();

  async initializeMap(container: HTMLElement): Promise<void> {
    if (this.initialized) return;
    try {
      const options = {
        mapId: environment.mappedin.mapId,
        key: environment.mappedin.key,
        secret: environment.mappedin.secret,
      };
      const mapData: MapData = await getMapData(options);
      this.mapView = await show3dMap(container, mapData);
      this.initialized = true;
      console.log('Mappedin map initialized.');
      setTimeout(() => {
        if (this.mapView && typeof (this.mapView as any).updateSize === 'function') {
          (this.mapView as any).updateSize();
          console.log('Mappedin map resized.');
        } else {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing Mappedin map:', error);
    }
  }

  switchMapMode(): void {
    const current = this._isMappedin$.value;
    this._isMappedin$.next(!current);
    console.log(`Switched map mode: now using ${!current ? 'Mappedin' : 'Google Maps'}`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  destroyMap(): void {
    this.mapView = undefined;
    this.initialized = false;
  }
}
