import { CommonModule } from '@angular/common';
import { Component, Input} from '@angular/core';
import { Location } from 'src/app/interfaces/location.interface';
import { DirectionsService } from 'src/app/services/directions/directions.service';

@Component({
  selector: 'app-location-cards',
  imports: [CommonModule],
  templateUrl: './location-cards.component.html',
  styleUrls: ['./location-cards.component.scss'],
})
export class LocationCardsComponent{
  @Input() locations: Location[] = [];
  @Input() loading: boolean = false;

  constructor(private directionsService: DirectionsService) { }

  setDestination(location: any) {
    console.log(location);
    this.directionsService.setDestinationPoint({
      title: location.name,
      coordinates: location.coordinates,
      address: location.address
    });
  }
}
