import { Injectable } from '@angular/core';
import { MappedinService } from '../mappedin/mappedin.service';
import { Door, MapData, MapView } from '@mappedin/mappedin-js';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { DirectionsService } from '../abstract-directions.service';

/**
 * Service for handling indoor directions using the Mappedin system.
 *
 * This service extends the abstract DirectionsService with a MappedInLocation type and 
 * provides functionality to retrieve entrances for start and destination points, generate 
 * navigation directions, and render these directions on the map view.
 */
@Injectable({
  providedIn: 'root'
})
export class IndoorDirectionsService extends DirectionsService<MappedInLocation> {

  /**
   * Creates an instance of IndoorDirectionsService.
   *
   * @param mappedinService - An instance of MappedinService for accessing map data and view.
   */
  constructor(private mappedinService: MappedinService) {
    super();
  }

  /**
   * Retrieves the entrance doors associated with the start point.
   *
   * @returns A Promise that resolves to an array of Door objects corresponding to the start point entrances,
   *          or null if the start point is undefined.
   */
  public async getStartPointEntrances(): Promise<Door[] | null> {
    return this.getEntrances(await this.getStartPoint());
  }

  /**
   * Retrieves the entrance doors associated with the destination point.
   *
   * @returns A Promise that resolves to an array of Door objects corresponding to the destination point entrances,
   *          or null if the destination point is undefined.
   */
  public async getDestinationPointEntrances(): Promise<Door[] | null> {
    return this.getEntrances(await this.getDestinationPoint());
  }

  /**
   * Retrieves the entrance doors for a specified room.
   *
   * This method fetches the map data for the room's indoor map and filters out the doors.
   *
   * @param room - The MappedInLocation object representing the room.
   * @returns A Promise that resolves to an array of Door objects filtered by type 'door',
   *          or null if the room is not defined.
   */
  public async getEntrances(room: MappedInLocation): Promise<Door[] | null> {
    if (room) {
      const mapData: MapData = this.mappedinService.getCampusMapData()[room.indoorMapId].mapData;
      return mapData.getByType('door').filter((door) => door.name === 'Door');
    }
    return null;
  }

  /**
   * Navigates between the start and destination points by drawing a route on the map.
   *
   * Ensure that your map has been fully initialized before calling this method.
   *
   * @param startPoint - The starting point for navigation.
   * @param destinationPoint - The destination point for navigation.
   * @returns A Promise that resolves when the navigation route has been drawn, or logs errors if navigation fails.
   */
  public async navigate(startPoint: any, destinationPoint: any): Promise<void> {
    const mapData: MapData = await this.mappedinService.getMapData();
    const mapView: MapView = this.mappedinService.mapView;
  
    if (!mapData || !startPoint || !destinationPoint) {
      console.error('Missing mapData, startPoint or destinationPoint', { mapData, startPoint, destinationPoint });
      return;
    }
  
    const directions = mapData.getDirections(startPoint, destinationPoint);
    if (!directions) {
      console.error('Unable to generate directions between rooms', { startPoint, destinationPoint });
      return;
    }
  
    try {
      mapView.Navigation.draw(directions);
    } catch (error) {
      console.error('Error drawing navigation route:', error);
    }
  }

  /**
   * Renders navigation directions between the start and destination points.
   *
   * This method determines whether the navigation should be handled directly between rooms
   * within the same building or via entrances when the rooms are in different buildings.
   *
   * @returns A Promise that resolves when the directions have been rendered.
   */
  async renderNavigation(): Promise<void> {
    const start = await this.getStartPoint();
    const destination = await this.getDestinationPoint();

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

  async clearNavigation(): Promise<void> {
    console.log('Clear Nav for indoor')
  }
}
