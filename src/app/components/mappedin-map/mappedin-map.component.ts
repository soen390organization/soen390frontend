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
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { combineLatest, filter } from 'rxjs';

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
      (async () => {
        try {
          await this.mappedinService.initialize(this.mappedinContainer.nativeElement);
          this.initialized.emit();
        } catch (error) {
          console.error('Error initializing mappedin map or computing route:', error);
        }

        combineLatest([
          this.indoorDirectionsService.getStartPoint$(),
          this.indoorDirectionsService.getDestinationPoint$(),
          this.mappedinService.getMapView()
        ])
          .pipe(filter(([start, destination, mapView]) => !!mapView))
          .subscribe(([start, destination, mapView]) => {
            (async () => {
              await this.indoorDirectionsService.clearNavigation();
              if (start || destination) {
                await this.indoorDirectionsService.renderNavigation();
              }
            })();
          });
      })();
    }
  }
}
