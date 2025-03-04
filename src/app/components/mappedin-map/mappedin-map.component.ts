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

  constructor(private readonly mappedinService: MappedinService) {}

  ngAfterViewInit(): void {
    if (this.mappedinContainer) {
      this.mappedinService.initializeMap(this.mappedinContainer.nativeElement)
        .then(() => {
          console.log('Mappedin Map initialized: ', this.initialized);
          this.initialized.emit();
        })
        .catch(error => {
          console.error('Error initializing map: ', error);
        });
    }
  } 
}
