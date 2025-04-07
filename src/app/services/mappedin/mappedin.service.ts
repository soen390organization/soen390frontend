// mappedin.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, take } from 'rxjs';
import { getMapData, show3dMap, MapData, MapView, DOORS } from '@mappedin/mappedin-js';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { environment } from 'src/environments/environment';
import { map } from 'cypress/types/bluebird';
import { MapViewBuilder } from 'src/app/builders/map-view.builder';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';

export interface BuildingData {
  name: string;
  abbreviation: string;
  address: string;
  coordinates: google.maps.LatLng;
  mapData: MapData;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MappedinService {
  public mapView: MapView | undefined;
  private mappedInContainer: HTMLElement | undefined;
  private mapId: string;
  private readonly mapData$ = new BehaviorSubject<MapData | null>(null);
  private readonly mapView$ = new BehaviorSubject<MapView | null>(null);
  private campusMapData = {};

  private readonly _isMappedin$ = new BehaviorSubject<boolean>(false);
  public isMappedin$ = this._isMappedin$.asObservable();

  constructor(private readonly concordiaDataService: ConcordiaDataService) {}

  async getFloors() {
    // Fetch the map data first
    const mapData = await firstValueFrom(this.mapData$);
    // Safely check if mapData is null or undefined
    if (!mapData) {
      return []; // Return an empty array if no map data is available
    }

    // Get floors by type 'floor' and map them to a simplified structure
    return mapData.getByType('floor').map((floor) => ({
      id: floor.id,
      name: floor.name
    }));
  }

  getCurrentFloor() {
    if (!this.mapView || !this.mapView.currentFloor) {
      return null;
    }
    const { id, name } = this.mapView.currentFloor;
    return { id, name };
  }

  setFloor(floorId: string) {
    this.mapView.setFloor(floorId);
  }

  async initialize(container: HTMLElement): Promise<void> {
    if (this.mapView) return; // Prevent re-initialization
    this.mappedInContainer = container;

    // Create buildings array for both campuses, filter for only MappedIn buildings
    let buildings = [
      ...this.concordiaDataService.getBuildings('sgw'),
      ...this.concordiaDataService.getBuildings('loy')
    ].filter((building) => building.indoorMapId);

    // Iterate over each building, grab mapData from MappedIn, index the building data
    await Promise.all(
      buildings.map(async (item) => {
        let mapId = item.indoorMapId;
        const mapData = await this.fetchMapData(mapId);

        this.campusMapData[mapId] = {
          name: item.name,
          abbreviation: item.abbreviation,
          address: item.address,
          coordinates: new google.maps.LatLng(item.coordinates),
          mapData
        };
      })
    );

    this.setMapData('67b674be13a4e9000b46cf2e');
  }

  public fetchMapData(mapId: string): Promise<MapData> {
    return getMapData({
      mapId,
      key: environment.mappedin.key,
      secret: environment.mappedin.secret
    });
  }

  public getCampusMapData() {
    return this.campusMapData;
  }

  public async setMapData(mapId: string) {
    if (mapId === this.mapId) return; // ← skip if it’s already active

    const mapData = this.campusMapData[mapId].mapData;
    this.mapData$.next(mapData);
    this.mapId = mapId;

    this.mapView = await new MapViewBuilder()
      .setContainer(this.mappedInContainer!)
      .setMapData(mapData)
      .build();

    this.mapView$.next(this.mapView);
  }

  public getMapData$(): Observable<MapData | null> {
    return this.mapData$.asObservable();
  }

  public async getMapData(): Promise<MapData | null> {
    return await firstValueFrom(this.getMapData$());
  }

  public getMapView(): Observable<MapView | null> {
    return this.mapView$.asObservable();
  }

  public getMapId(): string {
    return this.mapId;
  }

  public clearNavigation(): void {
    if (this.mapView.Navigation) {
      try {
        // Navigation cleared
        this.mapView.Navigation.clear();
      } catch (error) {
        console.error('Error clearing indoor navigation:', error);
      }
    }
  }

  public async findIndoorLocation(roomCode: string): Promise<MappedInLocation | null> {
    try {
      if (!this.hasValidRoomCode(roomCode)) {
        console.warn('Cannot find indoor location for empty or invalid room code');
        return null;
      }

      const campusData = this.getValidCampusData();
      if (!campusData) {
        console.warn('No campus data available');
        return null;
      }

      const buildingCode = this.extractBuildingCode(roomCode);
      const { mapId, building } = this.findBuildingByCode(campusData, buildingCode) ?? {};
      if (!building || !mapId) {
        console.warn(`No matching building found for code: ${buildingCode}`);
        return null;
      }

      const roomNumberPart = this.extractRoomNumber(roomCode);
      const bestRoom = this.findSpaceOrPoi(building.mapData, roomNumberPart, roomCode);
      if (!bestRoom) {
        console.warn(`No matching room found for ${roomCode} in building: ${building.name}`);
        return null;
      }

      return this.buildIndoorLocation(building, bestRoom, mapId);
    } catch (error) {
      console.error('Error finding indoor location:', error);
      return null;
    }
  }

  /** === HELPER METHODS BELOW === **/

  private hasValidRoomCode(roomCode: string): boolean {
    return !!roomCode?.trim();
  }

  private getValidCampusData(): Record<string, BuildingData> | null {
    const data = this.getCampusMapData() ?? {};
    return Object.keys(data).length > 0 ? data : null;
  }

  private extractBuildingCode(roomCode: string): string {
    return roomCode.split(/[-\s]/)[0].toUpperCase();
  }

  private extractRoomNumber(roomCode: string): string {
    // Safely return the second piece after splitting, or empty if missing
    return roomCode.split(/[-\s]/)[1] ?? '';
  }

  private findBuildingByCode(
    campusData: Record<string, BuildingData>,
    buildingCode: string
  ): { mapId: string; building: BuildingData } | null {
    for (const [mapId, building] of Object.entries(campusData)) {
      if (building.abbreviation?.toUpperCase() === buildingCode) {
        return { mapId, building };
      }
    }
    return null;
  }

  private findSpaceOrPoi(mapData: MapData, roomNumber: string, fullRoomCode: string): any {
    const spaces = mapData.getByType('space') ?? [];
    for (const space of spaces) {
      if (
        space?.name &&
        (space.name === roomNumber ||
          space.name.includes(roomNumber) ||
          fullRoomCode.includes(space.name))
      ) {
        return space;
      }
    }

    const pois = mapData.getByType('point-of-interest') ?? [];
    for (const poi of pois) {
      if (
        poi?.name &&
        (poi.name === roomNumber ||
          poi.name.includes(roomNumber) ||
          fullRoomCode.includes(poi.name))
      ) {
        return poi;
      }
    }
    return null;
  }

  private buildIndoorLocation(
    building: BuildingData,
    bestRoom: any,
    mapId: string
  ): MappedInLocation {
    return {
      title: `${building.abbreviation ?? ''} ${bestRoom.name}`.trim(),
      address: building.address ?? 'No Address',
      image: building.image ?? 'assets/images/poi_fail.png',
      indoorMapId: mapId,
      room: bestRoom,
      buildingCode: building.abbreviation ?? '',
      roomName: bestRoom.name,
      coordinates: building.coordinates,
      type: 'indoor'
    };
  }
}
