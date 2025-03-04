import { Component, AfterViewInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MappedinService } from 'src/app/services/mappedIn.service';

@Component({
  selector: 'app-mappedin-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mappedin-map.component.html',
  styleUrls: ['./mappedin-map.component.scss'],
})
export class MappedinMapComponent implements AfterViewInit {
  @ViewChild('mappedinContainer', { static: false }) mappedinContainer!: ElementRef;
  @Output() initialized = new EventEmitter<void>();

  constructor(private mappedinService: MappedinService) {}

  async ngAfterViewInit(): Promise<void> {
    if (this.mappedinContainer) {
      await this.mappedinService.initializeMap(this.mappedinContainer.nativeElement);
      this.initialized.emit();
    }
  }
}
