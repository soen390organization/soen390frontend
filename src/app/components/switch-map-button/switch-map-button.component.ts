import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MappedinService } from 'src/app/services/mappedIn.service';

@Component({
  selector: 'app-switch-map-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch-map-button.component.html',
  styleUrls: ['./switch-map-button.component.scss']
})
export class SwitchMapButtonComponent {
  constructor(public mappedinService: MappedinService) {}

  onClick(): void {
    this.mappedinService.switchMapMode();
  }
}
