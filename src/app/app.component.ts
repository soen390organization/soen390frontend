import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { getMapData, show3dMap } from '@mappedin/mappedin-js';

const options = {
  mapId: '67b39ca55b54d7000b151bdb', // John Molson Building MB
  key: 'mik_eGVRJrNs6bz7fm8en549e0799',
  secret: 'mis_BOEW2MPSJxdmI3neWVtzJoCliyic7MhuEBGTCmx2fk88c6a1071',
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  // Flag to toggle between the map and the rest of your app
  showMap = true;

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLElement>;

  async ngOnInit(): Promise<void> {
    if (this.showMap) {
      await this.initMap();
    }
  }

  async initMap(): Promise<void> {
    try {
      const mapData = await getMapData(options);
      if (this.mapContainer && this.mapContainer.nativeElement) {
        await show3dMap(this.mapContainer.nativeElement, mapData);
      } else {
        console.error('Map container element not found.');
      }
    } catch (error) {
      console.error('Error initializing the map:', error);
    }
  }

  toggleView(): void {
    // Toggle the view flag
    this.showMap = !this.showMap;
    // If switching to the map view, wait for the view to update and then initialize the map
    if (this.showMap) {
      setTimeout(() => {
        this.initMap();
      }, 0);
    }
  }
}
