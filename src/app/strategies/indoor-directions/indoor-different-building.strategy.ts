import { Injectable } from '@angular/core';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { AbstractIndoorStrategy } from './abstract-indoor.strategy';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { MapData } from '@mappedin/mappedin-js';

@Injectable({
  providedIn: 'root'
})
export class IndoorDifferentBuildingStrategy extends AbstractIndoorStrategy {
  constructor(public mappedInService: MappedinService) {
    super(mappedInService);
  }

  public async getRoutes(startPoint: MappedInLocation, destinationPoint: MappedInLocation) {
    const [startMapData, destinationMapData]: MapData[] = await Promise.all([
      this.mappedinService.getCampusMapData()[startPoint?.indoorMapId].mapData,
      this.mappedinService.getCampusMapData()[destinationPoint?.indoorMapId].mapData
    ]);

    this.route = [
      {
        indoorMapId: startPoint?.indoorMapId,
        directions: startMapData?.getDirections(
          startPoint.room,
          await this.getEntrances(startPoint)
        ),
        accessible_directions: startMapData?.getDirections(
          startPoint?.room,
          await this.getEntrances(startPoint),
          { accessible: true }
        )
      },
      {
        indoorMapId: destinationPoint?.indoorMapId,
        directions: destinationMapData?.getDirections(
          await this.getEntrances(destinationPoint),
          destinationPoint?.room
        ),
        accessible_directions: destinationMapData?.getDirections(
          await this.getEntrances(destinationPoint),
          destinationPoint?.room,
          { accessible: true }
        )
      }
    ];

    return this;
  }
}
