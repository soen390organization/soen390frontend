import { Component } from '@angular/core';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { PlacesService } from 'src/app/services/places.service';
import data from 'src/assets/ConcordiaData.json';

@Component({
  selector: 'app-switch-campus-button',
  templateUrl: './switch-campus-button.component.html',
  styleUrls: ['./switch-campus-button.component.scss'],
})
export class SwitchCampusButtonComponent {
  selectedCampus = 'SGW';

  constructor(private googleMapService: GoogleMapService, private placesService: PlacesService) { }

  switchCampus() {
    let location;
    if (this.selectedCampus === 'SGW') {
      this.selectedCampus = "LOY"
      location = new google.maps.LatLng(data.loy.coordinates);
    } else {
      this.selectedCampus = "SGW"
      location = new google.maps.LatLng(data.sgw.coordinates);
    }

    this.googleMapService.updateMapLocation(location);
    // this.placesService.getPointsOfInterest(location);
  }
}
