import { IonicModule } from '@ionic/angular';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-interaction-bar',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './interaction-bar.component.html',
  styleUrls: ['./interaction-bar.component.scss'],
})
export class InteractionBarComponent {
  selectedMode = 'bus';
  navigationInstruction = 'Get off at Loyola Campus';

  selectMode(mode: string) {
    this.selectedMode = mode;
    this.updateInstruction();
  }

  updateInstruction() {
    if (this.selectedMode === 'walk') {
      this.navigationInstruction = 'Walk to your destination';
    } else if (this.selectedMode === 'bus') {
      this.navigationInstruction = 'Get off at Loyola Campus';
    } else if (this.selectedMode === 'transit') {
      this.navigationInstruction = 'Take the metro to your stop';
    } else if (this.selectedMode === 'car') {
      this.navigationInstruction = 'Drive to your destination';
    }
  }

  endNavigation() {
    this.navigationInstruction = 'Navigation ended.';
  }
}
