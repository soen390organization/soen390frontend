import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions.service';

@Component({
  selector: 'app-mappedin-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mappedin-map.component.html',
  styleUrls: ['./mappedin-map.component.scss']
})
export class MappedinMapComponent implements AfterViewInit {
  @ViewChild('mappedinContainer', { static: false })
  mappedinContainer!: ElementRef;
  @Output() initialized = new EventEmitter<void>();

  constructor(
    private readonly mappedinService: MappedinService,
    private readonly indoorDirectionsService: IndoorDirectionsService
  ) {}

  ngAfterViewInit(): void {
    if (this.mappedinContainer) {
      this.mappedinService
        .initializeMap(this.mappedinContainer.nativeElement)
        .then(() => {
          console.log('Mappedin Map initialized.');
          this.initialized.emit();

          // Render hardcoded navigation instructions using IndoorDirectionsService
          this.indoorDirectionsService
            .navigateDefault()
            .then(() => {
              console.log('Hardcoded navigation instructions rendered.');
            })
            .catch((error) => {
              console.error('Error rendering navigation instructions:', error);
            });
        })
        .catch((error) => {
          console.error('Error initializing map:', error);
        });
    }
  }
}
