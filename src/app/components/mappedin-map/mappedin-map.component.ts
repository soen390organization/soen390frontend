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
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { combineLatest, filter, firstValueFrom, Observable } from 'rxjs';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';
import { Store } from '@ngrx/store';
import { selectShowRoute } from 'src/app/store/app';

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
  showRoute$: Observable<boolean>;


  constructor(
    private readonly store: Store,
    private readonly mappedinService: MappedinService,
    private readonly indoorDirectionsService: IndoorDirectionsService,
    private readonly navigationCoordinator: NavigationCoordinatorService
  ) {
    this.showRoute$ = this.store.select(selectShowRoute);
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.mappedinContainer) {
      combineLatest([
        this.indoorDirectionsService.getStartPoint(),
        this.indoorDirectionsService.getDestinationPoint(),
        this.mappedinService.getMapView(),
        this.showRoute$
      ])
        .pipe(filter(([start, destination, mapView, showRoute]) => !!mapView && showRoute))
        .subscribe(async ([start, destination, mapView, showRoute]) => {
          if (showRoute) {
            if (start && destination && start.indoorMapId === destination.indoorMapId) { // Directions for rooms in the same Building
              await this.indoorDirectionsService.navigate(start.room, destination.room);
            } else { // Directions for rooms in different Buildings
              if (start && start.indoorMapId === this.mappedinService.getMapId()) { // Current map is start 
                await this.indoorDirectionsService.navigate(start.room, await this.indoorDirectionsService.getStartPointEntrances());
              } else if (destination && destination.indoorMapId === this.mappedinService.getMapId()) { // Current map is destination
                await this.indoorDirectionsService.navigate(await this.indoorDirectionsService.getDestinationPointEntrances(), destination.room);
              }
            }
          }
        });

      try {
        await this.mappedinService.initialize(this.mappedinContainer.nativeElement);
        this.initialized.emit();
      } catch (error) {
        console.error('Error initializing mappedin map or computing route:', error);
      }
    }
  }
}
