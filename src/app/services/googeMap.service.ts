import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapService {
  private map!: google.maps.Map;
  private directionsService = new google.maps.DirectionsService();
  private directionsRenderer = new google.maps.DirectionsRenderer();

  setMap(map: google.maps.Map) {
    this.map = map;
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

  public calculateRoute(startAddress: string, destinationAddress: string): void {

    if (!this.map || !startAddress || !destinationAddress) {
      console.error('Directions request failed due to ', 'INVALID_INPUT');
      return;
    }

    // Ensure directionsRenderer is initialized before setting the map
    if (!this.directionsRenderer) {
      this.directionsRenderer = new google.maps.DirectionsRenderer();
    }

    // Bind the directions display to the given map
    this.directionsRenderer.setMap(this.map);

    const request: google.maps.DirectionsRequest = {
      origin: startAddress,
      destination: destinationAddress,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    this.directionsService.route(request, (response, status) => {
      if (status === 'OK' && response) {
        this.directionsRenderer.setDirections(response);
      } else if (status === 'ZERO_RESULTS'){
        console.error('Directions request failed due to', 'ZERO_RESULTS');
      } else {
        console.error('Directions request failed due to ', status);
      }
    });
  }
}
