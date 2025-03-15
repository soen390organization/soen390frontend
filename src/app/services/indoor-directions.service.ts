import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MappedinService } from './mappedin/mappedin.service';
import { MapData, MapView } from '@mappedin/mappedin-js';

@Injectable({
  providedIn: 'root'
})
export class IndoorDirectionsService {
  constructor(private mappedinService: MappedinService) {}

  private startRoom: any | null = null;
  private destinationRoom: any | null = null;
  


  public async setStartPoint(roomName: string, mapId: string): Promise<void> {
    const mapData: MapData = await firstValueFrom(
      this.mappedinService.getMapData().pipe(filter((data) => data !== null))
    );

    const room = mapData.getByType('space').find((space) => space.name === roomName);
    if (room) {
      this.startRoom = room;
      console.log(`Start room set to: ${roomName}`);
    } else {
      console.error(`Start room '${roomName}' not found.`);
    }
  }

   /**
   * Set the destination point externally.
   */
    public async setDestinationPoint(roomName: string, mapId: string): Promise<void> {
      const mapData: MapData = await firstValueFrom(
        this.mappedinService.getMapData().pipe(filter((data) => data !== null))
      );
  
      const room = mapData.getByType('space').find((space) => space.name === roomName);
      if (room) {
        this.destinationRoom = room;
        console.log(`Destination room set to: ${roomName}`);
      } else {
        console.error(`Destination room '${roomName}' not found.`);
      }
    }
    

  /**
   * Ensure that your map has been fully initialized before calling this method.
   */
  public async navigate(): Promise<void> {
    const mapData: MapData = await firstValueFrom(
      this.mappedinService.getMapData().pipe(filter((data) => data !== null))
    );

    const mapView: MapView = await firstValueFrom(
      this.mappedinService.getMapView().pipe(filter((data) => data !== null))
    );


    if (this.startRoom && this.destinationRoom) {
      const directions = mapData.getDirections(this.startRoom, this.destinationRoom);
      if (directions) {
        mapView.Navigation.draw(directions);
        console.log('Navigation route drawn between room 819 and room 150');
      } else {
        console.error('Unable to generate directions between room 819 and room 150.');
      }
    } else {
      console.error('Start room or destination room not found in map data.');
    }
  }
}
