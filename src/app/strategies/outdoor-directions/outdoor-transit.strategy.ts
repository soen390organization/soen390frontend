import { Injectable } from '@angular/core';
import { AbstractOutdoorStrategy } from './abstract-outdoor.strategy';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

@Injectable({
  providedIn: 'root'
})
export class OutdoorTransitStrategy extends AbstractOutdoorStrategy {
  constructor(private readonly googleMapService: GoogleMapService) {
    super('TRANSIT');
  }

  public async getRoutes(origin: GoogleMapLocation, destination: GoogleMapLocation) {
    const outdoorRouteBuilder = new OutdoorRouteBuilder();
    outdoorRouteBuilder
      .setMap(this.googleMapService.getMap())
      .addTransitRoute(origin.address, destination.address);

    this.routes = await outdoorRouteBuilder.build();
    return this;
  }
}
