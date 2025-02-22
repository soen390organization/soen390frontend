import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Step } from 'src/app/interfaces/step.interface';
import { DirectionsService } from 'src/app/services/directions/directions.service';

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

  startLocation: string = "McGill University, Montreal, QC";
  destinationLocation: string = "Old Port of Montreal, QC";

  // Used in a ngfor in the html to avoid duplication since the buttons are similar
  transportModes = [
    { mode: 'WALKING', icon: 'directions_walk' },
    { mode: 'TRANSIT', icon: 'directions_bus' },
    { mode: 'SHUTTLE', icon: 'directions_transit' },
    { mode: 'DRIVING', icon: 'directions_car' }
  ];

  constructor(private directionsService: DirectionsService) {}

  ngOnInit(): void {
    this.setMode('WALKING'); // Automatically loads walking directions
  }

  /**
   * Fetches directions using the DirectionsService with hardcoded Montreal locations.
   */
  loadDirections(mode: string) {
    this.isLoading = true;
    const travelMode = this.directionsService.getTravelMode(mode); // Convert string to enum

    this.directionsService
      .calculateRoute(this.startLocation, this.destinationLocation, travelMode) // Pass 3 arguments correctly
      .then(({ steps, eta }) => {
        this.steps = steps;
        this.eta = eta;
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Failed to fetch directions:', error);
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

