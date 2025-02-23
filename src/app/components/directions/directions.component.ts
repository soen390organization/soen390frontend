import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Step } from 'src/app/interfaces/step.interface';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { IconMapping } from 'src/app/interfaces/Icon-mapping';
import rawIconMapping from 'src/assets/icon-mapping.json';
const iconMapping = rawIconMapping as IconMapping;

/// <reference types="google.maps" />

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.scss'],
  imports: [CommonModule],

})

export class DirectionsComponent implements OnInit, OnDestroy {
  @ViewChild('directionsContainer') directionsContainer!: ElementRef;

  steps: Step[] = [];
  eta: string | null = null;
  selectedMode: string = 'WALKING';
  isLoading: boolean = false;
  currentWatchId: string | null = null;
  hasArrived: boolean = false; // New boolean to track arrival
  showAllSteps: boolean = true;

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
    private currentLocationService: CurrentLocationService,
    private ngZone: NgZone // Ensures updates are inside Angular’s zone

  ) {}



  ngOnInit(): void {
    this.waitForGoogleMaps().then(() => {
      console.log("Google Maps is ready! Initializing directions...");
      this.setMode('WALKING'); // Load directions only after Google Maps is ready
      this.startWatchingLocation();
    });
  }

  /**
   * Waits for the Google Maps API to be fully loaded before proceeding.
   */
  waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      const checkGoogleMaps = () => {
        if (typeof google !== 'undefined' && google.maps) {
          resolve();
        } else {
          console.warn("Google Maps API not ready yet. Retrying...");
          setTimeout(checkGoogleMaps, 200); // Retry every 200ms
        }
      };
      checkGoogleMaps();
    });
  }


  ngAfterViewInit(): void {
    this.observeComponentPosition();
  }

  /**
 * Continuously checks the component's Y position and updates `showAllSteps`.
 */
private observeComponentPosition(): void {
  const updatePosition = () => {
    this.updateShowAllSteps();
    requestAnimationFrame(updatePosition); // Efficient continuous tracking
  };

  requestAnimationFrame(updatePosition);
}

/**
 * Updates `showAllSteps` based on the component's Y position relative to the viewport.
 */
private updateShowAllSteps(): void {
  if (!this.directionsContainer) return;

  const componentRect = this.directionsContainer.nativeElement.getBoundingClientRect();
  const screenHeight = window.innerHeight;
  const triggerPoint = screenHeight / 2; // Adjust this threshold if needed

  this.showAllSteps = componentRect.top < triggerPoint;

}
  ngOnDestroy(): void {
    if (this.currentWatchId) {
      this.currentLocationService.clearWatch(this.currentWatchId);
    }
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

    const currentStep = this.steps[0];

    if (!currentStep.end_location) {
      console.warn("Missing end location in step:", currentStep);
      return;
    }

    const stepLat = currentStep.end_location.lat;
    const stepLng = currentStep.end_location.lng;
    const distance = this.calculateDistance(position.lat, position.lng, stepLat(), stepLng());

    console.log(`Current distance to next step: ${distance.toFixed(2)} meters`);

    if (distance < this.stepCompletionThreshold) {
      console.log("Step completed. Moving to next step.");
      this.steps.shift();

      if (this.steps.length === 0) {
        this.hasArrived = true;
      }
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
    this.hasArrived = false; // Reset arrival status when loading new directions
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

  getDirectionIcon(instructions: string): string {
    // Remove HTML tags
    const plainText = instructions.replace(/<[^>]*>/g, '');
    const lowerText = plainText.toLowerCase();
  
    // Check directions mapping.
    for (const key in iconMapping.directions_to_symbols) {
      if (lowerText.includes(key)) {
        return iconMapping.directions_to_symbols[key];
      }
    }
  
    // Check transit mapping.
    for (const key in iconMapping.transit_to_symbols) {
      if (lowerText.includes(key)) {
        return iconMapping.transit_to_symbols[key];
      }
    }
  
    // Fallback icon.
    return 'help_outline';
  }
   
  
}

