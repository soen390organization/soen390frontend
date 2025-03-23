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
import { firstValueFrom } from 'rxjs';
import { MappedInLocation } from 'src/app/interfaces/mappedin-location.interface';

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
    private readonly indoorDirectionsService: IndoorDirectionsService,
    private readonly navigationCoordinator: NavigationCoordinatorService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (this.mappedinContainer) {
      try {
        await this.mappedinService.initialize(this.mappedinContainer.nativeElement);
        console.log('Mappedin Map initialized.', this.mappedinService.getMapId());

        this.initialized.emit();

        // Retrieve indoor start and destination points from the indoor service.
        const startRoom = await firstValueFrom(this.indoorDirectionsService.getStartPoint());
        const destinationRoom = await firstValueFrom(
          this.indoorDirectionsService.getDestinationPoint()
        );

        if (startRoom && destinationRoom) {
          // Use the global coordinator to compute the complete route.
          const completeRoute = await this.navigationCoordinator.getCompleteRoute(
            startRoom as MappedInLocation,
            destinationRoom as MappedInLocation,
            'WALKING'
          );
          console.log('Indoor navigation route computed:', completeRoute);
          // Optionally, use the completeRoute data to render the directions.
        } else {
          console.error('Start or destination room not set.');
        }
      } catch (error) {
        console.error('Error initializing mappedin map or computing route:', error);
      }
    }
  }
}
