import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapSwitcherService, MapType } from 'src/app/services/mapSwitcher.service';

@Component({
  selector: 'app-switch-map-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch-map-button.component.html',
  styleUrls: ['./switch-map-button.component.scss']
})
export class SwitchMapButtonComponent {
  mapType = MapType;
  currentMap$ = this.mapSwitcherService.currentMap$;

  constructor(private mapSwitcherService: MapSwitcherService) {}

  toggleMap(): void {
    this.mapSwitcherService.toggleMap();
  }
}
