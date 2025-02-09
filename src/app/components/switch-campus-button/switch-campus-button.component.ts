import { Component, OnInit } from '@angular/core';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import data from 'src/assets/ConcordiaData.json';

@Component({
  selector: 'app-switch-campus-button',
  templateUrl: './switch-campus-button.component.html',
  styleUrls: ['./switch-campus-button.component.scss'],
})
export class SwitchCampusButtonComponent  implements OnInit {
  selectedCampus = 'SGW';
  sgwLocation = { lat: data.campuses.sgw.mapOptions.center.lat, lng: data.campuses.sgw.mapOptions.center.lng };
  loyLocation = { lat: data.campuses.loy.mapOptions.center.lat, lng: data.campuses.loy.mapOptions.center.lng };


  constructor(private googleMapService: GoogleMapService) { }

  ngOnInit() {}

  switchCampus() {
    let location;
    if (this.selectedCampus === 'SGW') {
      this.selectedCampus = "LOY"
      location = new google.maps.LatLng(this.loyLocation.lat, this.loyLocation.lng);
    } else {
      this.selectedCampus = "SGW"
      location = new google.maps.LatLng(this.sgwLocation.lat, this.sgwLocation.lng);
    }

    this.googleMapService.updateMapLocation(location);
  }
}
