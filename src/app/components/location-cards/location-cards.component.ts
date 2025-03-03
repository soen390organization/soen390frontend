import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LocationCard } from 'src/app/interfaces/location-card.interface';
import { RouteService } from 'src/app/services/directions/directions.service';

@Component({
  selector: 'app-location-cards',
  imports: [CommonModule],
  templateUrl: './location-cards.component.html',
  styleUrls: ['./location-cards.component.scss'],
})
export class LocationCardsComponent {
  @Input() locations: LocationCard[] = [];
  @Input() loading: boolean = false;

  constructor(private readonly directionsService: RouteService) {}

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'https://cdn.discordapp.com/attachments/1152015876300754956/1346007857719546017/image.png?ex=67c69f00&is=67c54d80&hm=536b59895f6facbe007133b8c1ab73d1b28060fe55d196a4e4077df61263fa66';
    imgElement.onerror = null; // Prevent infinite loop if the placeholder fails
  }

  setDestination(location: any) {
    console.log(location);
    this.directionsService.setDestinationPoint({
      title: location.name,
      coordinates: location.coordinates,
      address: location.address,
    });
  }
}
