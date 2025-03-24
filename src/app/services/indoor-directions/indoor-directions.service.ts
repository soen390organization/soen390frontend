import { Injectable } from '@angular/core';
import { filter, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { MappedinService } from '../mappedin/mappedin.service';
import { Door, MapData, MapView } from '@mappedin/mappedin-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { DirectionsService } from 'src/app/interfaces/directions-service.interface';
import { selectShowRoute } from 'src/app/store/app';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class IndoorDirectionsService implements DirectionsService {
  constructor(private store: Store, private mappedinService: MappedinService) {}

  startPointSubject$ = new BehaviorSubject<MappedInLocation | null>(null);
  destinationPointSubject$ = new BehaviorSubject<MappedInLocation | null>(null);

  public setStartPoint(startPoint: MappedInLocation): MappedInLocation {
    this.startPointSubject$.next(startPoint);
    return startPoint;
  }

  public getStartPoint(): Observable<MappedInLocation | null> {
    return this.startPointSubject$.asObservable();
  }

  public getStartPointEntrances(): Promise<Door[] | null> {
    return firstValueFrom(this.startPointSubject$).then((room) => {
      if (room) {
        const mapData: MapData = this.mappedinService.getCampusMapData()[room.indoorMapId].mapData;
        return mapData.getByType('door').filter((door) => door.name === 'Door');
      }
      return null;
    });
  }

  public setDestinationPoint(destinationPoint: MappedInLocation): MappedInLocation {
    this.destinationPointSubject$.next(destinationPoint);
    return destinationPoint;
  }

  public getDestinationPoint(): Observable<MappedInLocation | null> {
    return this.destinationPointSubject$.asObservable();
  }

  public async getDestinationPointEntrances(): Promise<Door[] | null> {
    const room = await firstValueFrom(this.destinationPointSubject$);
    if (room) {
      const mapData: MapData = this.mappedinService.getCampusMapData()[room.indoorMapId].mapData;
      return mapData.getByType('door').filter((door) => door.name === 'Door');
    }
    return null;
  }

  public clearStartPoint(): void {
    this.startPointSubject$.next(null);
    this.mappedinService.clearNavigation();
  }

  public clearDestinationPoint(): void {
    this.destinationPointSubject$.next(null);
    this.mappedinService.clearNavigation();
  }

  /**
   * Ensure that your map has been fully initialized before calling this method.
   */
  public async navigate(startPoint: any, destinationPoint: any): Promise<void> {
    const mapData: MapData = await firstValueFrom(this.mappedinService.getMapData());
    const mapView: MapView = this.mappedinService.mapView;

    if (!mapData || !startPoint || !destinationPoint) {
      return console.error('Missing mapData/start/destination', {
        mapData,
        startPoint,
        destinationPoint
      });
    }

    const directions = mapData.getDirections(startPoint, destinationPoint);
    if (!directions) {
      return console.error('Unable to generate directions between rooms', {
        startPoint,
        destinationPoint
      });
    }

    try {
      mapView.Navigation.draw(directions);
    } catch (err) {
      console.error('Error drawing navigation route:', err);
    }
  }

  async renderDirections(): Promise<void> {
    const start = await firstValueFrom(this.getStartPoint());
    const destination = await firstValueFrom(this.getDestinationPoint());

    if (start && destination && start.indoorMapId === destination.indoorMapId) { // Directions for rooms in the same Building
      await this.navigate(start.room, destination.room);
    } else { // Directions for rooms in different Buildings
      if (start && start.indoorMapId === this.mappedinService.getMapId()) { // Current map is start 
        await this.navigate(start.room, await this.getStartPointEntrances());
      } else if (destination && destination.indoorMapId === this.mappedinService.getMapId()) { // Current map is destination
        await this.navigate(await this.getDestinationPointEntrances(), destination.room);
      }
    }
  }
}
