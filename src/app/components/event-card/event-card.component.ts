import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { DirectionsService } from 'src/app/services/directions/directions.service';

@Component({
  selector: 'app-event-card',
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent {
  @Input() events: EventInfo[] = [];
  @Input() loading: boolean = false;
  time: string = 'hello';

  constructor(private readonly directionsService: DirectionsService) {}

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

  setDestination(location: GoogleMapLocation) {
    this.directionsService.setDestinationPoint(location);
  }
}
