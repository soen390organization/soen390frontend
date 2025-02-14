import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-location-cards',
  imports: [CommonModule],
  templateUrl: './location-cards.component.html',
  styleUrls: ['./location-cards.component.scss'],
})
export class LocationCardsComponent  implements OnInit {
  @Input() locations: { name: string; address: string; image: string }[] = [];
  @Input() loading: boolean = false;

  constructor() { }

  ngOnInit() {}

}
