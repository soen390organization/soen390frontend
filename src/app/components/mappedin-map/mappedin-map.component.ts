import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MappedinService } from 'src/app/services/mappedIn.service';

@Component({
  selector: 'app-mappedin-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mappedin-map.component.html',
  styleUrls: ['./mappedin-map.component.scss'],
})
export class MappedinMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mappedinContainer', { static: false }) mappedinContainer!: ElementRef;
  loading: boolean = true;

  constructor(private mappedinService: MappedinService) {}

  async ngAfterViewInit(): Promise<void> {
    if (this.mappedinContainer && !this.mappedinService.isInitialized()) {
      await this.mappedinService.initializeMap(this.mappedinContainer.nativeElement);
    }
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.mappedinService.destroyMap();
  }
}
