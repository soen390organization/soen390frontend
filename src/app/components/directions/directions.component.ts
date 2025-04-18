import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Step } from 'src/app/interfaces/step.interface';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { IconMapping } from 'src/app/interfaces/Icon-mapping';
import rawIconMapping from 'src/assets/icon-mapping.json';
import { Store } from '@ngrx/store';
import { setShowRoute } from 'src/app/store/app';
import {
  OutdoorDrivingStrategy,
  OutdoorShuttleStrategy,
  OutdoorTransitStrategy,
  OutdoorWalkingStrategy
} from 'src/app/strategies/outdoor-directions';
import { AbstractOutdoorStrategy } from 'src/app/strategies/outdoor-directions/abstract-outdoor.strategy';

const iconMapping = rawIconMapping as IconMapping;

/// <reference types="google.maps" />

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class DirectionsComponent implements OnDestroy {
  @ViewChild('directionsContainer') directionsContainer!: ElementRef;

  steps: Step[] = [];
  eta: string | null = null;
  selectedMode: string = 'WALKING';
  isLoading: boolean = false;
  currentWatchId: string | null = null;
  hasArrived: boolean = false;
  private readonly endNavigationSubscription: any;
  currentRouteData: { eta: string | null; distance: number } | null = null;

  private readonly stepCompletionThreshold = 30;
  private readonly observer!: IntersectionObserver;

  constructor(
    private readonly store: Store,
    public readonly outdoorDirectionsService: OutdoorDirectionsService,
    public readonly outdoorWalkingStrategy: OutdoorWalkingStrategy,
    public readonly outdoorDrivingStrategy: OutdoorDrivingStrategy,
    public readonly outdoorTransitStrategy: OutdoorTransitStrategy,
    public readonly outdoorShuttleStrategy: OutdoorShuttleStrategy,
    private readonly currentLocationService: CurrentLocationService
  ) {}

  ngOnInit(): void {
    this.outdoorDirectionsService.getSelectedStrategy$().subscribe((strategy) => {
      if (strategy) {
        this.steps = strategy.getTotalSteps();
        console.log(this.steps);
        this.startWatchingLocation();
      }
    });
  }

  public setStrategy(strategy: AbstractOutdoorStrategy) {
    this.outdoorDirectionsService.clearNavigation();
    this.outdoorDirectionsService.setSelectedStrategy(strategy);
    this.outdoorDirectionsService.renderNavigation();
  }

  ngOnDestroy(): void {
    if (this.currentWatchId) {
      this.currentLocationService.clearWatch(this.currentWatchId);
    }

    if (this.endNavigationSubscription) {
      this.endNavigationSubscription.unsubscribe();
    }

    if (this.observer && this.directionsContainer?.nativeElement) {
      this.observer.unobserve(this.directionsContainer.nativeElement);
    }
  }

  startWatchingLocation(): void {
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

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3;
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

  getDirectionIcon(instructions: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(instructions, 'text/html');
    const plainText = doc.body.textContent || '';
    const lowerText = plainText.toLowerCase();

    for (const key in iconMapping.directions_to_symbols) {
      if (lowerText.includes(key)) {
        return iconMapping.directions_to_symbols[key];
      }
    }

    for (const key in iconMapping.transit_to_symbols) {
      if (lowerText.includes(key)) {
        return iconMapping.transit_to_symbols[key];
      }
    }

    return 'help_outline';
  }

  onEndClick(): void {
    this.store.dispatch(setShowRoute({ show: false }));
  }

  getTravelModes() {
    return [
      { mode: 'WALKING', icon: 'directions_walk', strategy: this.outdoorWalkingStrategy },
      { mode: 'DRIVING', icon: 'directions_car', strategy: this.outdoorDrivingStrategy },
      { mode: 'TRANSIT', icon: 'directions_bus', strategy: this.outdoorTransitStrategy },
      { mode: 'SHUTTLE', icon: 'directions_transit', strategy: this.outdoorShuttleStrategy }
    ].filter((item) => item.strategy?.routes?.length);
  }
}
