import { Injectable } from '@angular/core';
import { DirectionsService } from './directions.service';
import { Step } from '../../interfaces/step.interface';

@Injectable({
  providedIn: 'root',
})
export class DirectionsWrapperService {
  constructor(private directionsService: DirectionsService) {}

  public initialize(map: google.maps.Map): void {
    this.directionsService.initialize(map);
  }

  public async calculateRoute(
    start: string,
    destination: string,
    mode: google.maps.TravelMode = google.maps.TravelMode.WALKING,
  ): Promise<{ steps: Step[]; eta: string | null }> {
    try {
      return await this.directionsService.calculateRoute(
        start,
        destination,
        mode,
      );
    } catch (error) {
      console.error('Error fetching directions:', error);
      throw error;
    }
  }

  public setRouteColor(mode: google.maps.TravelMode): void {
    this.directionsService.setRouteColor(mode);
  }
}
