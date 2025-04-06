import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';

@Component({
  selector: 'app-accessibility-button',
  templateUrl: './accessibility-button.component.html',
  imports: [CommonModule]
})
export class AccessibilityButtonComponent {
  constructor(public readonly indoorDirectionsService: IndoorDirectionsService) {}

  async toggleAccessibility() {
    const strategy = await this.indoorDirectionsService.getSelectedStrategy();
    strategy.toggleAccessibility();
    this.indoorDirectionsService.renderNavigation();
  }
}
