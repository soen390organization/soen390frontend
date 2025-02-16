import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Step } from 'src/app/interfaces/step.interface';
/// <reference types="google.maps" />

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.scss'],
  imports: [CommonModule],

})

export class DirectionsComponent implements AfterViewInit {
  steps: Step[] = [];
  eta: string | null = null;
  selectedMode: string = 'WALKING'; // Store as a string
  isLoading: boolean = false;

  constructor() {}

  ngAfterViewInit(): void {
    this.loadDirections('Start Location', 'Destination', this.getTravelMode(this.selectedMode));
  }

  /**
   * Maps the selected mode string to `google.maps.TravelMode`
   */
  getTravelMode(mode: string): google.maps.TravelMode {
    switch (mode) {
      case 'WALKING':
        return google.maps.TravelMode.WALKING;
      case 'TRANSIT':
        return google.maps.TravelMode.TRANSIT;
      case 'DRIVING':
        return google.maps.TravelMode.DRIVING;
      default:
        return google.maps.TravelMode.WALKING;
    }
  }

  /**
   * Calls calculateRoute as if it's from an external API.
   */
  loadDirections(startAddress: string, destinationAddress: string, travelMode: google.maps.TravelMode) {
    this.isLoading = true;

    calculateRoute(startAddress, destinationAddress, travelMode)
      .then(({ steps, eta }) => {
        this.steps = steps;
        this.eta = eta;
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error fetching directions:', error);
        this.isLoading = false;
      });
  }

  /**
   * Updates travel mode and fetches new directions.
   */
  setMode(mode: string) {
    this.selectedMode = mode; // Store as string
    this.loadDirections('Start Location', 'Destination', this.getTravelMode(mode));
  }
}

/**
 * Simulated external API function.
 */
function calculateRoute(
  startAddress: string,
  destinationAddress: string,
  travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING
): Promise<{ steps: Step[]; eta: string | null }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let response: { steps: Step[]; eta: string | null } = { steps: [], eta: null };

      if (travelMode === google.maps.TravelMode.WALKING) {
        response = {
          steps: [
            { instructions: 'Walk north on Main St.', start_location: new google.maps.LatLng(45.5017, -73.5673), distance: { text: '200 m', value: 200 }, duration: { text: '2 mins', value: 2 }, transit_details: undefined },
            { instructions: 'Turn right onto Guy St.', start_location: new google.maps.LatLng(45.502, -73.5678), distance: { text: '300 m', value: 300 }, duration: { text: '4 mins', value: 4 }, transit_details: undefined },
          ],
          eta: '6 mins',
        };
      } else if (travelMode === google.maps.TravelMode.TRANSIT) {
        response = {
          steps: [
            { instructions: 'Walk to the nearest bus stop.', start_location: new google.maps.LatLng(45.5017, -73.5673), distance: { text: '150 m', value: 150 }, duration: { text: '2 mins', value: 2 }, transit_details: undefined },
            { instructions: 'Take Bus #24 towards Downtown.', start_location: new google.maps.LatLng(45.502, -73.5678), distance: { text: '2.5 km', value: 2500 }, duration: { text: '10 mins', value: 10 }, transit_details: undefined },
          ],
          eta: '15 mins',
        };
      } else if (travelMode === google.maps.TravelMode.DRIVING) {
        response = {
          steps: [
            { instructions: 'Drive north on Main St.', start_location: new google.maps.LatLng(45.5017, -73.5673), distance: { text: '1.2 km', value: 1200 }, duration: { text: '2 mins', value: 2 }, transit_details: undefined },
            { instructions: 'Turn right onto Guy St.', start_location: new google.maps.LatLng(45.502, -73.5678), distance: { text: '3 km', value: 3000 }, duration: { text: '5 mins', value: 5 }, transit_details: undefined },
          ],
          eta: '7 mins',
        };
      }

      resolve(response);
    }, 1000); // Simulated 1-second API delay
  });
}
