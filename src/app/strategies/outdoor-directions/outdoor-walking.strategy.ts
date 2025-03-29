import { Injectable } from '@angular/core';
import { AbstractOutdoorStrategy } from './abstract-outdoor.strategy';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
import { GoogleMapService } from 'src/app/services/google-map.service';

@Injectable({
  providedIn: 'root'
})
export class OutdoorWalkingStrategy extends AbstractOutdoorStrategy {
  constructor(private readonly googleMapService: GoogleMapService) {
    super();
  }

  public async getRoutes(origin: string, destination: string) {
    const outdoorRouteBuilder = new OutdoorRouteBuilder();
    outdoorRouteBuilder
      .setMap(this.googleMapService.getMap())
      .addWalkingRoute(origin, destination);

    this.routes = await outdoorRouteBuilder.build();
    return this;
  }
}
