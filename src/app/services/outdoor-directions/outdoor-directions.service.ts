import { Injectable } from '@angular/core';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { DirectionsService } from '../abstract-directions.service';
import {
  OutdoorWalkingStrategy,
  OutdoorDrivingStrategy,
  OutdoorTransitStrategy,
  OutdoorShuttleStrategy
} from 'src/app/strategies/outdoor-directions';
import { AbstractOutdoorStrategy } from 'src/app/strategies/outdoor-directions/abstract-outdoor.strategy';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { GoogleMapService } from '../google-map.service';

@Injectable({
  providedIn: 'root'
})
export class OutdoorDirectionsService extends DirectionsService<GoogleMapLocation> {
  public selectedStrategySubject = new BehaviorSubject<AbstractOutdoorStrategy | null>(null);
  public startPointMarker: google.maps.marker.AdvancedMarkerElement;
  public destinationPointMarker: google.maps.marker.AdvancedMarkerElement;

  constructor(
    private readonly googleMapService: GoogleMapService,
    public readonly outdoorWalkingStrategy: OutdoorWalkingStrategy,
    public readonly outdoorDrivingStrategy: OutdoorDrivingStrategy,
    public readonly outdoorTransitStrategy: OutdoorTransitStrategy,
    public readonly outdoorShuttleStrategy: OutdoorShuttleStrategy
  ) {
    super();
    this.setTravelMode('WALKING');
  }

  // Make observable
  public getSelectedStrategy$() {
    return this.selectedStrategySubject.asObservable();
  }

  public async getSelectedStrategy() {
    return await firstValueFrom(this.getSelectedStrategy$());
  }

  public setSelectedStrategy(strategy: AbstractOutdoorStrategy) {
    this.selectedStrategySubject.next(strategy);
  }

  public async showStartMarker() {
    if (!this.startPointMarker) {
      const pin = new google.maps.marker.PinElement({
        background: '#28a745',
        glyph: 'A',
        glyphColor: 'white',
        borderColor: '#ffffff',
        scale: 1.2
      });
      pin.element.setAttribute('data-marker-id', 'start-marker');
      this.startPointMarker = new google.maps.marker.AdvancedMarkerElement({
        content: pin.element
      });
    }

    const startPoint = await this.getStartPoint();

    this.startPointMarker.title = startPoint.title;
    this.startPointMarker.position = startPoint.coordinates;
    this.startPointMarker.map = this.googleMapService.getMap();
  }

  public clearStartMarker() {
    this.startPointMarker.map = null;
  }

  public async showDestinationMarker() {
    if (!this.destinationPointMarker) {
      const pin = new google.maps.marker.PinElement({
        background: '#dc3545',
        glyph: 'B',
        glyphColor: 'white',
        borderColor: '#ffffff',
        scale: 1.2
      });
      pin.element.setAttribute('data-marker-id', 'destination-marker');
      this.destinationPointMarker = new google.maps.marker.AdvancedMarkerElement({
        content: pin.element
      });
    }

    const destinationPoint = await this.getDestinationPoint();

    this.destinationPointMarker.title = destinationPoint.title;
    this.destinationPointMarker.position = destinationPoint.coordinates;
    this.destinationPointMarker.map = this.googleMapService.getMap();
  }

  public clearDestinationMarker() {
    this.destinationPointMarker.map = null;
  }

  public async getShortestRoute() {
    // Grab origin from StartPoint & destination from DestinationPoint
    const [origin, destination] = await Promise.all([
      await this.getStartPoint(),
      await this.getDestinationPoint()
    ]);
    // Load all Strategies
    const strategies = await Promise.all([
      await this.outdoorWalkingStrategy.getRoutes(origin, destination),
      await this.outdoorDrivingStrategy.getRoutes(origin, destination),
      await this.outdoorTransitStrategy.getRoutes(origin, destination),
      await this.outdoorShuttleStrategy.getRoutes(origin, destination)
    ]);

    // Return the strategy with the smallest duration
    const validStrategies = strategies.filter(Boolean);

    if (validStrategies.length === 0) {
      return null; // or handle appropriately
    }

    return validStrategies.reduce(
      (prev, curr) => (prev.getTotalDuration().value < curr.getTotalDuration().value ? prev : curr),
      validStrategies[0]
    );
  }

  public async renderNavigation() {
    (await this.getSelectedStrategy()).renderRoutes();
  }

  public async clearNavigation() {
    (await this.getSelectedStrategy()).clearRenderedRoutes();
  }
}
