import { Injectable } from '@angular/core';
import { OutdoorDirectionsStrategy } from 'src/app/interfaces/outdoor-directions-strategy.interface';

@Injectable({
  providedIn: 'root'
})
export abstract class AbstractOutdoorStrategy implements OutdoorDirectionsStrategy {
  routes: any[] = [];

  public getTotalDuration() {
    let totalDuration = 0;
  
    this.getTotalLegs().forEach(leg => {
      totalDuration += leg.duration.value;
    });
  
    const minutes = (totalDuration / 60).toFixed(0);
  
    return {
      value: totalDuration,
      text: `${minutes} mins`,
    };
  }

  public getTotalDistance() {
    let totalDistance = 0;
  
    this.getTotalLegs().forEach(leg => {
      totalDistance += leg.distance.value;
    });
  
    let distanceText = '';
    if (totalDistance >= 1000) {
      distanceText = (totalDistance / 1000).toFixed(1) + 'km';
    } else {
      distanceText = totalDistance + 'm';
    }
  
    return {
      value: totalDistance,
      text: distanceText
    };
  }
  
  public getTotalLegs() {
    const combinedRoutes = [].concat(...this.routes.map(route => route.response.routes));
    const routeLegs = [].concat(...combinedRoutes.map(route => route.legs));

    return routeLegs;
  }

  public getTotalSteps() {
    const legSteps = [].concat(...this.getTotalLegs().map(leg => leg.steps));
    // Filter out steps that we decide to hide
    return legSteps.filter(step => !step.hide);
  }

  public renderRoutes() {
    this.routes.forEach(route => {
      route.renderer.setDirections(route.response);
    });
  }

  public clearRenderedRoutes() {
    this.routes.forEach(route => {
      route.renderer.set('directions', null);
    });
  }

  abstract getRoutes(origin: string, destination: string): Promise<any>;
}
