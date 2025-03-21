import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MappedinService } from '../mappedin/mappedin.service';
import { Door, MapData, MapView } from '@mappedin/mappedin-js';
import { data } from 'cypress/types/jquery';

@Injectable({
  providedIn: 'root'
})
export class IndoorDirectionsService {
  constructor(private mappedinService: MappedinService) {}

  private startRoom: any | null = null;
  private destinationRoom: any | null = null;
  

  public setStartPoint(room: any){
    this.startRoom = room;
  }

  public getStartPoint(): any{
    return this.startRoom;
  }

  public async getStartPointEntrances() {
    if (this.startRoom) {
      const mapData: MapData = this.mappedinService.getCampusMapData()[this.startRoom.indoorMapId].mapData;
      return mapData.getByType("door").filter((door) => door.name === "Door");
    }
    return null;
  }

  public setDestinationPoint(room: any){
    this.destinationRoom = room;
  }   

  public getDestinationPoint(): any{
    return this.destinationRoom;
  }

  public async getDestinationPointEntrances() {
    if (this.destinationRoom) {
      const mapData: MapData = this.mappedinService.getCampusMapData()[this.destinationRoom.indoorMapId].mapData;
      return mapData.getByType("door").filter((door) => door.name === "Door");
    }
    return null;
  }

  /**
   * Ensure that your map has been fully initialized before calling this method.
   */
  public async navigate(start: any, destination: any): Promise<void> {
    const mapData: MapData = await firstValueFrom(
      this.mappedinService.getMapData().pipe(filter((data) => data !== null))
    );

    const mapView: MapView = this.mappedinService.mapView;

    if (start && destination) {
      const directions = mapData.getDirections(start, await destination);
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
