import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { Step } from 'src/app/interfaces/step.interface';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
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
  currentWatchId: string | null = null;
  private readonly stepCompletionThreshold = 30;

  startLocation: string = "McGill University, Montreal, QC";
  destinationLocation: string = "Old Port of Montreal, QC";

  // Used in a ngfor in the html to avoid duplication since the buttons are similar
  transportModes = [
    { mode: 'WALKING', icon: 'directions_walk' },
    { mode: 'TRANSIT', icon: 'directions_bus' },
    { mode: 'SHUTTLE', icon: 'directions_transit' },
    { mode: 'DRIVING', icon: 'directions_car' }
  ];

  constructor(
    private directionsService: DirectionsService,
    private currentLocationService: CurrentLocationService
  ) {}

  ngOnInit(): void {
    this.setMode('WALKING'); // Automatically loads walking directions
    this.startWatchingLocation();
  }

  startWatchingLocation(): void {
    // Use your custom service to watch the user's location.
    this.currentLocationService.watchLocation((position: { lat: number; lng: number }) => {
      this.onPositionUpdate(position);
    })
    .then((watchId: string) => {
      this.currentWatchId = watchId;
    })
    .catch((err) => console.error('Error starting location watch:', err));
  }

  onPositionUpdate(position: { lat: number; lng: number }): void {
    if (this.steps.length === 0) return;

    // Assuming each step has an end_location property with lat and lng.
    const currentStep = this.steps[0];
    const stepLat = currentStep.end_location.lat();
    const stepLng = currentStep.end_location.lng();

    const distance = this.calculateDistance(position.lat, position.lng, stepLat, stepLng);

    // If the user is within the threshold, consider the step complete and remove it.
    if (distance < this.stepCompletionThreshold) {
      this.steps.shift();
    }
  }

  // Haversine formula to calculate the distance between two points in meters.
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lng2 - lng1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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

