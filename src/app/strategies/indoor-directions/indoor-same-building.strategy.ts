import { Injectable } from '@angular/core';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { AbstractIndoorStrategy } from './abstract-indoor.strategy';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { MapData } from '@mappedin/mappedin-js';

@Injectable({
  providedIn: 'root'
})
export class IndoorSameBuildingStrategy extends AbstractIndoorStrategy {
  constructor(mappedInService: MappedinService) {
    super(mappedInService);
  }

  public async getRoutes(startPoint: MappedInLocation, destinationPoint: MappedInLocation) {
    const mapData: MapData =
      await this.mappedinService.getCampusMapData()[startPoint.indoorMapId].mapData;

    if (!mapData || !startPoint || !destinationPoint) {
      console.error('Missing mapData, startPoint or destinationPoint', {
        mapData,
        startPoint,
        destinationPoint
      });
      return null;
    }

    if (startPoint.indoorMapId !== destinationPoint.indoorMapId) return null;

    this.route = {
      indoorMapId: startPoint.indoorMapId,
      directions: mapData.getDirections(startPoint.room, destinationPoint.room),
      accessible_directions: mapData.getDirections(startPoint.room, destinationPoint.room, {
        accessible: true
      })
    };

    return this;
  }
}
