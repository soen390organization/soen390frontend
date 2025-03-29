import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Location } from 'src/app/interfaces/location.interface';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';

@Component({
  selector: 'app-location-cards',
  imports: [CommonModule],
  templateUrl: './location-cards.component.html',
  styleUrls: ['./location-cards.component.scss']
})
export class LocationCardsComponent {
  @Input() locations: Location[] = [];
  @Input() loading: boolean = false;

  constructor(private readonly outdoorDirectionsService: OutdoorDirectionsService) {}

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/poi_fail.png';
    imgElement.onerror = null; // Prevent infinite loop if the placeholder fails
  }

  setDestination(location: any) {
    this.outdoorDirectionsService.setDestinationPoint({
      title: location.title,
      coordinates: location.coordinates,
      address: location.address,
      type: 'outdoor'
    });
  }
}
