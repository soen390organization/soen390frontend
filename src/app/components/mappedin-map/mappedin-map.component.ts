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


  constructor(
    private readonly store: Store,
    private readonly mappedinService: MappedinService,
    private readonly indoorDirectionsService: IndoorDirectionsService,
    private readonly navigationCoordinator: NavigationCoordinatorService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (this.mappedinContainer) {
      try {
        await this.mappedinService.initialize(this.mappedinContainer.nativeElement);
        this.initialized.emit();

        // // Retrieve indoor start and destination points from the indoor service.
        // const startRoom = await firstValueFrom(this.indoorDirectionsService.getStartPoint());
        // const destinationRoom = await firstValueFrom(
        //   this.indoorDirectionsService.getDestinationPoint()
        // );

        // if (startRoom && destinationRoom) {
        //   // Use the global coordinator to compute the complete route.
        //   const completeRoute = await this.navigationCoordinator.getCompleteRoute(
        //     startRoom as MappedInLocation,
        //     destinationRoom as MappedInLocation,
        //     'WALKING'
        //   );
        // } else {
        //   console.error('Start or destination room not set.');
        // }
      } catch (error) {
        console.error('Error initializing mappedin map or computing route:', error);
      }

      combineLatest([
        this.indoorDirectionsService.getStartPoint(),
        this.indoorDirectionsService.getDestinationPoint(),
        this.mappedinService.getMapView(),
        this.store.select(selectShowRoute)
      ])
        .pipe(filter(([start, destination, mapView, showRoute]) => !!mapView && showRoute))
        .subscribe(async ([start, destination, mapView, showRoute]) => {
          if (showRoute) {
            await this.indoorDirectionsService.renderDirections();
          }
        });
    }
  }
}
