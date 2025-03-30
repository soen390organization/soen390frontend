import { Injectable } from '@angular/core';
import { AbstractOutdoorStrategy } from './abstract-outdoor.strategy';
import { OutdoorRouteBuilder } from 'src/app/builders/outdoor-route.builder';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { ShuttleDataService } from 'src/app/services/shuttle-data/shuttle-data.service';

@Injectable({
  providedIn: 'root'
})
export class OutdoorShuttleStrategy extends AbstractOutdoorStrategy {
  constructor(
    private readonly shuttleDataService: ShuttleDataService,
    private readonly concordiaDataService: ConcordiaDataService,
    private readonly googleMapService: GoogleMapService
  ) {
    super('SHUTTLE');
  }

  public async getRoutes(origin: string, destination: string) {
    // Select bus stop based on which campus user is closest to
    const [startCampus, destinationCampus] = await Promise.all([
      await this.googleMapService.getCoordsFromAddress(origin)
        .then(originCoorinates => this.concordiaDataService.getNearestCampus(originCoorinates)),
      await this.googleMapService.getCoordsFromAddress(destination)
        .then(destinationCoordinates => this.concordiaDataService.getNearestCampus(destinationCoordinates)),
    ]);

    // Fail if campuses are the same
    if (startCampus === destinationCampus)
      return null; // Fail

    const nextBus = this.shuttleDataService.getNextBus('sgw');

    // Fail if nextBus does not exist
    if (!nextBus)
      return null; // Fail 

    const outdoorRouteBuilder = new OutdoorRouteBuilder();
    outdoorRouteBuilder
      .setMap(this.googleMapService.getMap())
      .addWalkingRoute(origin, startCampus.address)
      .addDrivingRoute(startCampus.address, destinationCampus.address)
      .addWalkingRoute(destinationCampus.address, destination);

    this.routes = await outdoorRouteBuilder.build().then(builtRoutes => {
      const drivingRouteInfo = builtRoutes[1].getResponse().routes[0].legs[0];
      (drivingRouteInfo.steps as any[]).forEach((step, index) => {
        if (!index) {
          // Replace first step with shuttle instruction
          step.instructions = `Next shuttle at ${nextBus} on ${startCampus.abbreviation.toUpperCase()} terminal.`
        } else {
          // Hide driving instructions
          step.hide = true;
        }
      })
      return builtRoutes
    });

    return this;
  }
}
