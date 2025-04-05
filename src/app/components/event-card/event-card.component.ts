import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';

@Component({
  selector: 'app-event-card',
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent {
  @Input() events: EventInfo[] = [];
  @Input() loading: boolean = false;

  constructor(
    private readonly navigationCoordinator: NavigationCoordinatorService
  ) {}

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/poi_fail.png';
    imgElement.onerror = null; // Prevent infinite loop if the placeholder fails
  }

  formatEventTime(start: Date | string, end: Date | string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid time';
    }

    const weekdayFormatter = new Intl.DateTimeFormat('en-CA', { weekday: 'short' });
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const day = weekdayFormatter.format(startDate).slice(0, 2);
    const startTime = timeFormatter.format(startDate);
    const endTime = timeFormatter.format(endDate);

    return `${day}, ${startTime} - ${endTime}`;
  }

  /**
   * Sets the destination point and generates a route from the user's current location
   * @param location The outdoor Google Map location
   * @param mappedInLocation The indoor MappedIn location
   */
  async setDestination(location: GoogleMapLocation, mappedInLocation?: any) {
    try {
      if (mappedInLocation && mappedInLocation.type === 'indoor') {
        // If we have indoor location data, use that
        await this.navigationCoordinator.routeFromCurrentLocationToDestination(mappedInLocation);
      } else {
        // Otherwise use the outdoor location
        await this.navigationCoordinator.routeFromCurrentLocationToDestination(location);
      }
    } catch (error) {
      console.error('Error setting destination:', error);
    }
  }
}
