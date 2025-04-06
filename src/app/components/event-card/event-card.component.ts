import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { setMapType, MapType } from 'src/app/store/app';

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
    private readonly store: Store,
    private readonly currentLocationService: CurrentLocationService,
    private readonly outdoorDirectionsService: OutdoorDirectionsService,
    private readonly indoorDirectionsService: IndoorDirectionsService,
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

  /**
   * Sets the destination point and generates a route from the user's current location
   * @param location The outdoor Google Map location
   * @param mappedInLocation The indoor MappedIn location, if it exists
   */
  async setDestination(location: GoogleMapLocation, mappedInLocation?: any) {
    const currentLocation = await this.currentLocationService.getCurrentLocation();
    console.log(currentLocation);
    this.outdoorDirectionsService.setStartPoint({
      title: 'Your Location',
      address: `${currentLocation.lat}, ${currentLocation.lng}`,
      coordinates: new google.maps.LatLng(currentLocation),
      type: 'outdoor'
    });

    if (mappedInLocation) {
      this.indoorDirectionsService.setDestinationPoint(mappedInLocation);
      this.outdoorDirectionsService.setDestinationPoint(location);

      if (mappedInLocation.indoorMapId !== this.mappedInService.getMapId()) {
        await this.mappedInService.setMapData(mappedInLocation.indoorMapId);
      }
      this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
    } else {
      this.outdoorDirectionsService.setDestinationPoint(location);
      this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
    }
  }
}
