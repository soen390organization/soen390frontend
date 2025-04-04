import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { DirectionsStrategy } from 'src/app/interfaces/directions-strategy.interface';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { Door, MapData, MapView } from '@mappedin/mappedin-js';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface IndoorRoute {
  indoorMapId: string;
  directions: any;
}

export abstract class AbstractIndoorStrategy implements DirectionsStrategy<MappedInLocation> {
  accessibility: boolean = false;
  route: IndoorRoute | IndoorRoute[];

  constructor(public mappedinService: MappedinService) {}

  public isAccessibityEnabled() {
    return this.accessibility;
  }

  public setAccessibility(flag: boolean) {
    this.accessibility = flag;
  }

  public async getEntrances(room: MappedInLocation): Promise<Door[] | null> {
    if (room) {
      console.log('working!');
      const mapData: MapData = this.mappedinService.getCampusMapData()[room.indoorMapId].mapData;
      return mapData.getByType('door').filter((door) => door.name === 'Door');
    }
    console.log('null!');
    return null;
  }

  public async renderRoutes(): Promise<void> {
    const mapView: MapView = this.mappedinService.mapView;

    let indoorRoute;

    if (Array.isArray(this.route)) {
      indoorRoute = this.route.find((item) => item.indoorMapId == this.mappedinService.getMapId());
    } else {
      if (this.route.indoorMapId == this.mappedinService.getMapId()) indoorRoute = this.route;
    }

    if (indoorRoute) {
      try {
        mapView.Navigation.draw(indoorRoute.directions);
      } catch (error) {
        console.error('Error drawing navigation route:', error);
      }
    }
  }

  public clearRenderedRoutes() {
    this.mappedinService.mapView.clear();
  }

  abstract getRoutes(origin: MappedInLocation, destination: MappedInLocation);
}
