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
  

  public  setStartPoint(room: any){
    this.startRoom = room;
    
  }

  public  setDestinationPoint(room: any){
    this.destinationRoom = room;
    this.navigate()
  }   

  /**
   * Ensure that your map has been fully initialized before calling this method.
   */
  public async navigate(): Promise<void> {
    const mapData: MapData = await firstValueFrom(
      this.mappedinService.getMapData().pipe(filter((data) => data !== null))
    );

    const mapView: MapView = this.mappedinService.mapView;


    if (this.startRoom && this.destinationRoom) {
      console.log(mapData);
      const directions = mapData.getDirections(this.startRoom.room, this.destinationRoom.room);
      if (directions) {
        mapView.Navigation.draw(directions);
        console.log('Navigation route drawn');
      } else {
        console.error('Unable to generate directions between rooms.');
      }
    } else {
      console.error('Start room or destination room not found in map data.');
    }
  }
}
