import { CommonModule } from '@angular/common';
import { Component, Input} from '@angular/core';
import { LocationCard } from 'src/app/interfaces/location-card.interface';

@Component({
  selector: 'app-location-cards',
  imports: [CommonModule],
  templateUrl: './location-cards.component.html',
  styleUrls: ['./location-cards.component.scss'],
})
export class LocationCardsComponent{
  @Input() locations: LocationCard[] = [];
  @Input() loading: boolean = false;

  constructor() { }


}
