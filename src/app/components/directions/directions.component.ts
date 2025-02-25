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

export class DirectionsComponent implements OnInit {
  steps: Step[] = [];
  eta: string | null = null;
  selectedMode: string = 'WALKING';
  isLoading: boolean = false;

  // Used in a ngfor in the html to avoid duplication since the buttons are similar
  transportModes = [
    { mode: 'WALKING', icon: 'directions_walk' },
    { mode: 'TRANSIT', icon: 'directions_bus' },
    { mode: 'SHUTTLE', icon: 'directions_transit' },
    { mode: 'DRIVING', icon: 'directions_car' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.setMode('WALKING'); // Automatically loads walking directions
  }

  /**
   * Calls a simulated API to fetch hardcoded routes.
   */
  loadDirections(mode: string) {
    this.isLoading = true;

    calculateRoute(mode)
      .then(({ steps, eta }) => {
        this.steps = steps;
        this.eta = eta;
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  /**
   * Updates the travel mode and loads new hardcoded directions.
   */
  setMode(mode: string, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedMode = mode;
    this.loadDirections(mode);
  }
}

/**
 * Simulated API function returning hardcoded steps for each mode.
 */
function calculateRoute(mode: string): Promise<{ steps: Step[]; eta: string | null }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let response: { steps: Step[]; eta: string | null } = { steps: [], eta: null };

      if (mode === 'WALKING') {
        response = {
          steps: [
            {
              instructions: 'Walk north on Main St.',
              start_location: new google.maps.LatLng(45.5017, -73.5673),
              distance: { text: '200 m', value: 200 },
              duration: { text: '2 mins', value: 2 },
              transit_details: undefined
            },
            {
              instructions: 'Turn right onto Guy St.',
              start_location: new google.maps.LatLng(45.502, -73.5678),
              distance: { text: '300 m', value: 300 },
              duration: { text: '4 mins', value: 4 },
              transit_details: undefined
            },
          ],
          eta: '6 mins',
        };
      } else if (mode === 'TRANSIT' || mode == "SHUTTLE") {
        response = {
          steps: [
            {
              instructions: 'Walk to the nearest bus stop.',
              start_location: new google.maps.LatLng(45.5017, -73.5673),
              distance: { text: '150 m', value: 150 },
              duration: { text: '2 mins', value: 2 },
              transit_details: undefined
            },
            {
              instructions: 'Take Bus #24 towards Downtown.',
              start_location: new google.maps.LatLng(45.502, -73.5678),
              distance: { text: '2.5 km', value: 2500 },
              duration: { text: '10 mins', value: 10 },
              transit_details: {
                line: { short_name: '24' }
              } as google.maps.TransitDetails
            },
          ],
          eta: '15 mins',
        };
      } else if (mode === 'DRIVING') {
        response = {
          steps: [
            {
              instructions: 'Drive north on Main St.',
              start_location: new google.maps.LatLng(45.5017, -73.5673),
              distance: { text: '1.2 km', value: 1200 },
              duration: { text: '2 mins', value: 2 },
              transit_details: undefined
            },
            {
              instructions: 'Turn right onto Guy St.',
              start_location: new google.maps.LatLng(45.502, -73.5678),
              distance: { text: '3 km', value: 3000 },
              duration: { text: '5 mins', value: 5 },
              transit_details: undefined
            },
          ],
          eta: '7 mins',
        };
      }

      resolve(response);
    }, 1000); // Simulated 1-second API delay
  });
}
