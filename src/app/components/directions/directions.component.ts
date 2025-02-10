import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.scss'],
})
export class DirectionsComponent implements OnInit {
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;

  constructor() {}

  ngOnInit() {
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
  }

  /**
   * Public method that calculates and displays a route on the given map
   */
  public calculateRoute(
    map: google.maps.Map,
    startAddress: string,
    destinationAddress: string
  ): void {

    if (!map || !startAddress || !destinationAddress) {
      console.error('Directions request failed due to ', 'INVALID_INPUT');
      return;
    }

    // Ensure directionsRenderer is initialized before setting the map
    if (!this.directionsRenderer) {
      this.directionsRenderer = new google.maps.DirectionsRenderer();
    }

    // Bind the directions display to the given map
    this.directionsRenderer.setMap(map);

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
