import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Step } from 'src/app/interfaces/step.interface';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { IconMapping } from 'src/app/interfaces/Icon-mapping';
import rawIconMapping from 'src/assets/icon-mapping.json';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { CompleteRoute } from 'src/app/interfaces/routing-strategy.interface';
import { Store } from '@ngrx/store';
import { setShowRoute } from 'src/app/store/app';
import { OutdoorDrivingStrategy, OutdoorShuttleStrategy, OutdoorTransitStrategy, OutdoorWalkingStrategy } from 'src/app/strategies/outdoor-directions';

const iconMapping = rawIconMapping as IconMapping;

/// <reference types="google.maps" />

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.scss'],
  imports: [CommonModule]
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
  private endNavigationSubscription: any;
  currentRouteData: { eta: string | null; distance: number } | null = null;

  travelModes: any[] = [];

  private readonly stepCompletionThreshold = 30;

  constructor(
    private store: Store,
    public outdoorDirectionsService: OutdoorDirectionsService,
    public readonly outdoorWalkingStrategy: OutdoorWalkingStrategy,
    public readonly outdoorDrivingStrategy: OutdoorDrivingStrategy,
    public readonly outdoorTransitStrategy: OutdoorTransitStrategy,
    public readonly outdoorShuttleStrategy: OutdoorShuttleStrategy,
    private currentLocationService: CurrentLocationService,
    private navigationCoordinator: NavigationCoordinatorService
  ) {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // this.observeComponentPosition();
  }

  public getTravelModes() {
    const travelModes = [
      { mode: 'WALKING', icon: 'directions_walk', strategy: this.outdoorWalkingStrategy },
      { mode: 'DRIVING', icon: 'directions_car', strategy: this.outdoorDrivingStrategy },
      { mode: 'TRANSIT', icon: 'directions_bus', strategy: this.outdoorTransitStrategy },
      { mode: 'SHUTTLE', icon: 'directions_transit', strategy: this.outdoorShuttleStrategy }
    ];
    return travelModes.filter(item => item.strategy?.routes?.length);
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
    if (this.endNavigationSubscription) {
      this.endNavigationSubscription.unsubscribe();
    }
  }

  startWatchingLocation(): void {
    // Use your custom service to watch the user's location.
    this.currentLocationService
      .watchLocation((position: { lat: number; lng: number }) => {
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
      console.warn('Missing end location in step:', currentStep);
      return;
    }

    const stepLat = currentStep.end_location.lat;
    const stepLng = currentStep.end_location.lng;
    const distance = this.calculateDistance(position.lat, position.lng, stepLat(), stepLng());

    if (distance < this.stepCompletionThreshold) {
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
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async loadDirections(mode: string) {
    this.isLoading = true;
    this.hasArrived = false;
    const start = await this.outdoorDirectionsService.getStartPoint();
    const destination = await this.outdoorDirectionsService.getDestinationPoint();
    if (!start || !destination) {
      console.error('Missing start or destination.');
      this.isLoading = false;
      return;
    }

    try {
      // Directly use the objects obtained from the getters.
      const completeRoute: CompleteRoute = await this.navigationCoordinator.getCompleteRoute(
        start,
        destination,
        mode
      );
      const { steps, eta } = completeRoute.segments[0].instructions;
      this.steps = steps;
      this.eta = eta;
    } catch (error) {
      console.error('Failed to fetch directions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Updates the travel mode and loads new hardcoded directions.
   */
  async setMode(mode: string, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedMode = mode;
    this.loadDirections(mode);
  }

  getDirectionIcon(instructions: string): string {
    // Remove HTML tags
    // Create a new DOM parser
    const parser = new DOMParser();
    // Parse the instructions as HTML
    const doc = parser.parseFromString(instructions, 'text/html');
    // Extract the text content, which removes all HTML tags
    const plainText = doc.body.textContent || '';
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

  onEndClick(): void {
    this.store.dispatch(setShowRoute({ show: false }));
  }
}
