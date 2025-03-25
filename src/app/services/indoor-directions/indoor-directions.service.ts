import { Injectable } from '@angular/core';
import { filter, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { MappedinService } from '../mappedin/mappedin.service';
import { Door, MapData, MapView } from '@mappedin/mappedin-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';

@Injectable({
  providedIn: 'root'
})
export class IndoorDirectionsService {
  constructor(private mappedinService: MappedinService) {}

  private startRoom$ = new BehaviorSubject<MappedInLocation | null>(null);
  private destinationRoom$ = new BehaviorSubject<MappedInLocation | null>(null);

  public setStartPoint(room: any): void {
    this.startRoom$.next(room);
  }

  public getStartPoint(): Observable<any | null> {
    return this.startRoom$.asObservable();
  }

  public getStartPointEntrances(): Promise<Door[] | null> {
    return firstValueFrom(this.startRoom$).then((room) => {
      if (room) {
        const mapData: MapData = this.mappedinService.getCampusMapData()[room.indoorMapId].mapData;
        return mapData.getByType('door').filter((door) => door.name === 'Door');
      }
      return null;
    });
  }

  public setDestinationPoint(room: any): void {
    this.destinationRoom$.next(room);
  }

  public getDestinationPoint(): Observable<any | null> {
    return this.destinationRoom$.asObservable();
  }

  public async getDestinationPointEntrances(): Promise<Door[] | null> {
    const room = await firstValueFrom(this.destinationRoom$);
    if (room) {
      const mapData: MapData = this.mappedinService.getCampusMapData()[room.indoorMapId].mapData;
      return mapData.getByType('door').filter((door) => door.name === 'Door');
    }
    return null;
  }

  public clearStartPoint(): void {
    this.startRoom$.next(null);
    this.mappedinService.clearNavigation();
  }

  public clearDestinationPoint(): void {
    this.destinationRoom$.next(null);
    this.mappedinService.clearNavigation();
  }

  /**
   * Ensure that your map has been fully initialized before calling this method.
   */
  public async navigate(startRoom: any, destinationRoom: any): Promise<void> {
    const mapData: MapData = await firstValueFrom(this.mappedinService.getMapData());
    const mapView: MapView = this.mappedinService.mapView;

    if (!mapData || !startRoom || !destinationRoom) {
      return console.error('Missing mapData/start/destination', {
        mapData,
        startRoom,
        destinationRoom
      });
    }

    const directions = mapData.getDirections(startRoom, destinationRoom);
    if (!directions) {
      return console.error('Unable to generate directions between rooms', {
        startRoom,
        destinationRoom
      });
    }

    try {
      mapView.Navigation.draw(directions);
    } catch (err) {
      console.error('Error drawing navigation route:', err);
    }
  }
}
