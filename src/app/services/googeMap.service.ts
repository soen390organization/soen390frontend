import { Injectable } from '@angular/core';
import { PlacesService } from './places.service';
import { DirectionsService } from './directions/directions.service';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapService {
  private map!: google.maps.Map;

  constructor(
    private readonly routeService: DirectionsService,
    private readonly placesService: PlacesService,
  ) {}

  initialize(map: google.maps.Map) {
    this.map = map;
    this.placesService.initialize(this.map);
    this.routeService.initialize(map);
  }

  getMap(): google.maps.Map {
    return this.map;
  }

  updateMapLocation(location: google.maps.LatLng) {
    if (this.map) {
      this.map.setCenter(location);
      this.map.setZoom(18);
    }
  }

  createMarker(
    position: google.maps.LatLng,
    iconUrl: string,
  ): google.maps.Marker {
    return new google.maps.Marker({
      position,
      map: this.map,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(40, 40) },
    });
  }
}
