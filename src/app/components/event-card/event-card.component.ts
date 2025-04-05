import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { Store } from '@ngrx/store';
import { MapType, setMapType } from 'src/app/store/app';

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
    private store: Store,
    private readonly outdoorDirectionsService: OutdoorDirectionsService,
    private readonly indoorDirectionsService: IndoorDirectionsService,
    private readonly currentLocationService: CurrentLocationService,
    private readonly mappedInService: MappedinService
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

  async setDestination(event: EventInfo) {
    const currentLocation = await this.currentLocationService.getCurrentLocation();
    this.outdoorDirectionsService.setStartPoint({
      title: 'Your Location',
      address: `${currentLocation.lat}, ${currentLocation.lng}`,
      coordinates: new google.maps.LatLng(currentLocation),
      type: 'outdoor'
    });

    if (event.mappedInLoc.indoorMapId && event.mappedInLoc.room) {
      console.log(event);
      this.indoorDirectionsService.setDestinationPoint(event.mappedInLoc);
      this.outdoorDirectionsService.setDestinationPoint(event.googleLoc);

      if (event.mappedInLoc.indoorMapId !== this.mappedInService.getMapId()) {
        await this.mappedInService.setMapData(event.mappedInLoc.indoorMapId);
      }
      this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
    } else {
      this.outdoorDirectionsService.setDestinationPoint(event.googleLoc);
      this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
    }
  }
}
