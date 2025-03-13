import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MappedinService } from './mappedIn.service';
import { MapData, MapView } from '@mappedin/mappedin-js';

@Injectable({
  providedIn: 'root',
})
export class IndoorDirectionsService {
  constructor(private mappedinService: MappedinService) {}

  /**
   * Helper function that polls until mapView is available from MappedinService.
   */
  private async waitForMapView(): Promise<MapView> {
    return new Promise((resolve) => {
      const checkMapView = () => {
        const mapView: MapView = (this.mappedinService as any).mapView;
        if (mapView) {
          resolve(mapView);
        } else {
          setTimeout(checkMapView, 100);
        }
      };
      checkMapView();
    });
  }

  /**
   * Hardcoded default navigation between room "860.03" and room "860.05".
   * Ensure that your map has been fully initialized before calling this method.
   */
  public async navigateDefault(): Promise<void> {
    const mapData: MapData = await firstValueFrom(
      this.mappedinService.getMapData().pipe(filter((data) => data !== null)),
    );

    const mapView: MapView = await this.waitForMapView();
    if (!mapView) {
      console.error('MapView is not available yet.');
      return;
    }

    // Hardcoded for demo purposes
    const startRoom = mapData
      .getByType('space')
      .find((space) => space.name === '819');
    const destinationRoom = mapData
      .getByType('space')
      .find((space) => space.name === '150');

    if (startRoom && destinationRoom) {
      const directions = mapData.getDirections(startRoom, destinationRoom);
      if (directions) {
        mapView.Navigation.draw(directions);
        console.log('Navigation route drawn between room 819 and room 150');
      } else {
        console.error(
          'Unable to generate directions between room 819 and room 150.',
        );
      }
    } else {
      console.error('Start room or destination room not found in map data.');
    }
  }
}
