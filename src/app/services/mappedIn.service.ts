// mappedin.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, take } from 'rxjs';
import { getMapData, show3dMap, MapData, MapView, DOORS} from '@mappedin/mappedin-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MappedinService {
  private mapView: MapView | undefined;
  private mappedInContainer: HTMLElement | undefined;
  private mapData$ = new BehaviorSubject<MapData | null>(null);
  
  private readonly _isMappedin$ = new BehaviorSubject<boolean>(false);
  public isMappedin$ = this._isMappedin$.asObservable();

  async getFloors() {
    // Fetch the map data first
    const mapData = await firstValueFrom(this.mapData$);
    // Safely check if mapData is null or undefined
    if (!mapData) {
      return [];  // Return an empty array if no map data is available
    }
    
    // Get floors by type 'floor' and map them to a simplified structure
    return mapData.getByType('floor').map(floor => ({
      id: floor.id,
      name: floor.name,
    }));
  }

  getCurrentFloor() {
    const { id, name } = this.mapView?.currentFloor;
    return { id, name }
  }
 
  setFloor(floorId: string) {
    this.mapView.setFloor(floorId);
  }

  async initializeMap(container: HTMLElement): Promise<void> {
    this.mappedInContainer = container;
    this.setMapData('67b674be13a4e9000b46cf2e');
  }

  private initializeConnections(mapData: MapData) {
    mapData.getByType("connection").forEach((connection) => {
      let label;
      let labelColor;
      // Find the coordinates for the current floor.
      const coords = connection.coordinates.find(
        (coord) => coord.floorId === this.mapView.currentFloor.id
      );
      // Label the connection.
      if (connection.type == 'stairs') {
        label = 'Stairs';
        labelColor = '#228C22';
      } else if (connection.type === 'elevator') {
        label = 'Elevator';
        labelColor = '#a000c8';
      }
      if (coords) {
        this.mapView.Labels.add(coords, label, {
          interactive: true,
          appearance: {
            marker: {
              foregroundColor: {
                active: labelColor,
                // inactive: color,
              },
            },
          text: {
            foregroundColor: labelColor,
          },
        },
      });
      }
    });
  }

  private initializePointsOfInterests(mapData: MapData) {
    mapData.getByType('point-of-interest').forEach((poi) => {
      if (poi.name) {
        this.mapView.Labels.add(poi, poi.name, {
            interactive: true,
            appearance: {
              marker: {
                foregroundColor: {
                  active: ['Bathrooms', 'Water Fountain'].includes(poi.name) ? '#1d63dc' : '#000000',
                  // inactive: color,
                },
              },
            text: {
              foregroundColor: ['Bathrooms', 'Water Fountain'].includes(poi.name) ? '#1d63dc' : '#000000',
            },
          },
        });
      }
    });
  }

  private initializeSpaces(mapData: MapData) {
    mapData.getByType('space').forEach((space) => {
      if (space.name) {
        this.mapView.Labels.add(space, space.name, { interactive: true });
      }
    });

    this.mapView.updateState(DOORS.Exterior, {
      visible: true,
      color: 'black',
      opacity: 0.6,
    });

    this.mapView.updateState(DOORS.Interior, {
      visible: true,
      color: 'lightgrey',
      opacity: 0.3,
    });
  }

  /**
   * Protected method that wraps the external getMapData API call.
   * Tests can override or spy on this method.
   */
  // protected async getMapData(): Promise<Observable<MapData>>  {
  //   // Use firstValueFrom to get the first emitted value
  //   const mapId = await firstValueFrom(this.selectedMap$);  // Convert to promise and await the value
  
  //   // Now pass the mapId as a string value
  //   return getMapData({
  //     mapId: mapId,
  //     key: environment.mappedin.key,
  //     secret: environment.mappedin.secret,
  //   });
  // }

  public async setMapData(mapId: string) {
    // Get the map data and update the observable
    this.mapData$.next(await getMapData({
      mapId,
      key: environment.mappedin.key,
      secret: environment.mappedin.secret,
    }));
  
    // Resolve the observable to get the MapData object
    const mapData = await firstValueFrom(this.mapData$);
    // Pass the resolved mapData to show3dMap
    this.mapView = await this.show3dMap(this.mappedInContainer, mapData);

    this.initializeSpaces(mapData);
    this.initializePointsOfInterests(mapData);
    this.initializeConnections(mapData);
  }

  public getMapData(): Observable<MapData | null> {
    return this.mapData$.asObservable();
  }
  
  /**
   * Protected method that wraps the external show3dMap API call.
   * Tests can override or spy on this method.
   */
  protected show3dMap(container: HTMLElement, mapData: MapData): Promise<MapView> {
    return show3dMap(container, mapData);
  }
}
