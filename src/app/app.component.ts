import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { getVenue, showVenue } from '@mappedin/mappedin-js';

const options = {
 /*  venue: '67b39ca55b54d7000b151bdb',
  clientId: 'mik_eGVRJrNs6bz7fm8en549e0799',
  clientSecret: 'mis_BOEW2MPSJxdmI3neWVtzJoCliyic7MhuEBGTCmx2fk88c6a1071', */

/*   mapId: '67b39ca55b54d7000b151bdb', // John Molson Building MB
  key: 'mik_eGVRJrNs6bz7fm8en549e0799',
  secret:  'mis_BOEW2MPSJxdmI3neWVtzJoCliyic7MhuEBGTCmx2fk88c6a1071', */

  venue: 'mappedin-demo-mall',
  clientId: '5eab30aa91b055001a68e996',
  clientSecret: 'RJyRXKcryCMy4erZqqCbuB1NbR66QTGNXVE0x3Pg6oCIlUR1',
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  @ViewChild('app', { static: false }) mapEl!: ElementRef<HTMLElement>;

  async ngOnInit(): Promise<void> {
    try {
      const venue = await getVenue(options);
      if (this.mapEl && this.mapEl.nativeElement) {
        await showVenue(this.mapEl.nativeElement, venue);
      } else {
        console.error('Map element not found.');
      }
    } catch (error) {
      console.error('Error initializing the map:', error);
    }
  }
}
