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
}

@Injectable({
  providedIn: 'root'
})
export class MappedinService {
  public mapView: MapView | undefined;
  private mappedInContainer: HTMLElement | undefined;
  private mapId: string;
  private mapData$ = new BehaviorSubject<MapData | null>(null);
  private mapView$ = new BehaviorSubject<MapView | null>(null);
  private campusMapData = {};

  private readonly _isMappedin$ = new BehaviorSubject<boolean>(false);
  public isMappedin$ = this._isMappedin$.asObservable();

  constructor(private concordiaDataService: ConcordiaDataService) {}

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

  /**
   * Finds the best indoor location match for a given room or building code
   * Uses similar logic to the PlacesService's getPlaceSuggestions method
   * @param roomCode The room code or classroom code to find
   * @returns A promise that resolves to the best indoor location match
   */
  public async findIndoorLocation(roomCode: string): Promise<MappedInLocation | null> {
    if (!roomCode) {
      console.warn('Cannot find indoor location for empty room code');
      return null;
    }

    console.log('Finding indoor location for room code:', roomCode);

    try {
      // Get all campus building data
      const campusData = this.getCampusMapData() || {};
      if (Object.keys(campusData).length === 0) {
        console.warn('No campus data available');
        return null;
      }

      // Extract building code from room code (e.g., 'H-531' -> 'H')
      // This is a simple extraction - you may need more sophisticated parsing
      const buildingCode = roomCode.split(/[-\s]/)[0].toUpperCase();
      console.log('Extracted building code:', buildingCode);

      // Find matching building
      let matchingBuilding: any = null;
      let matchingMapId = null;

      for (const [mapId, building] of Object.entries(campusData) as [string, any][]) {
        if (building.abbreviation && building.abbreviation.toUpperCase() === buildingCode) {
          matchingBuilding = building;
          matchingMapId = mapId;
          console.log('Found matching building:', building.name);
          break;
        }
      }

      if (!matchingBuilding || !matchingMapId) {
        console.warn('No matching building found for code:', buildingCode);

        // If no direct match, try a more fuzzy search
        const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedCode = normalizeString(buildingCode);

        for (const [mapId, building] of Object.entries(campusData) as [string, any][]) {
          if (
            building.abbreviation &&
            building.name &&
            (normalizeString(building.abbreviation).includes(normalizedCode) ||
              normalizeString(building.name).includes(normalizedCode))
          ) {
            matchingBuilding = building;
            matchingMapId = mapId;
            console.log('Found fuzzy matching building:', building.name);
            break;
          }
        }

        // If still no match, just take the first building (normally Hall building)
        if (!matchingBuilding) {
          const firstMapId = Object.keys(campusData)[0];
          matchingBuilding = campusData[firstMapId];
          matchingMapId = firstMapId;
          console.log('Using default building:', matchingBuilding?.name || 'Unknown');
        }
      }

      // Now try to find the specific room within the building
      if (matchingBuilding && matchingMapId) {
        const mapData = matchingBuilding.mapData;

        // Try to find room by name (exact match)
        const roomNumberPart = roomCode.split(/[-\s]/)[1] || '';
        console.log('Looking for room number:', roomNumberPart);

        let bestRoom: any = null;

        // First check spaces
        const spaces = mapData.getByType('space') || [];
        for (const space of spaces) {
          if (
            space.name &&
            (space.name === roomNumberPart ||
              space.name.includes(roomNumberPart) ||
              roomCode.includes(space.name))
          ) {
            bestRoom = space;
            console.log('Found matching space:', space.name);
            break;
          }
        }

        // If no match in spaces, check points of interest
        if (!bestRoom) {
          const pois = mapData.getByType('point-of-interest') || [];
          for (const poi of pois) {
            if (
              poi.name &&
              (poi.name === roomNumberPart ||
                poi.name.includes(roomNumberPart) ||
                roomCode.includes(poi.name))
            ) {
              bestRoom = poi;
              console.log('Found matching POI:', poi.name);
              break;
            }
          }

          // If still no match, use a room on the first floor as default
          if (!bestRoom && spaces.length > 0) {
            try {
              // Get rooms on the first floor
              const floors = mapData.getByType('floor') || [];
              const firstFloor = floors.length > 0 ? floors[0] : null;

              if (firstFloor) {
                const firstFloorRooms = spaces.filter(
                  (space) =>
                    space.geometries &&
                    space.geometries[0] &&
                    space.geometries[0].floor === firstFloor.id
                );

                if (firstFloorRooms.length > 0) {
                  bestRoom = firstFloorRooms[0];
                  console.log('Using default room on first floor:', bestRoom.name);
                } else {
                  bestRoom = spaces[0];
                  console.log('Using first available space:', bestRoom.name);
                }
              } else {
                bestRoom = spaces[0];
                console.log('Using first available space:', bestRoom.name);
              }
            } catch (error) {
              console.error('Error finding rooms on first floor:', error);
              bestRoom = spaces[0];
              console.log('Fallback to first available space');
            }
          }
        }

        // Create and return the indoor location
        if (matchingBuilding && matchingMapId) {
          const indoorLocation: MappedInLocation = {
            title:
              `${matchingBuilding.abbreviation || ''} ${bestRoom ? bestRoom.name : roomCode}`.trim(),
            address: matchingBuilding.address || 'No Address',
            image: matchingBuilding.image || 'assets/images/poi_fail.png',
            indoorMapId: matchingMapId,
            room: bestRoom || roomCode,
            buildingCode: matchingBuilding.abbreviation || '',
            roomName: bestRoom ? bestRoom.name : roomCode,
            coordinates: matchingBuilding.coordinates,
            type: 'indoor'
          };

          console.log('Created indoor location:', indoorLocation);
          return indoorLocation;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding indoor location:', error);
      return null;
    }
  }
}
