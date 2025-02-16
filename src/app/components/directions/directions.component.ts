import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.scss'],
  imports: [CommonModule],

})
export class DirectionsComponent {
  selectedMode = 'walk'; // Default mode

  // Method to change selected mode
  setMode(mode: string) {
    this.selectedMode = mode;
  }
}
