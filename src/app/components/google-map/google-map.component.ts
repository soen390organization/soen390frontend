/// <reference types="google.maps" />
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';
import data from 'src/assets/ConcordiaData.json';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map!: google.maps.Map;
  currentLocationService: CurrentLocationService = new CurrentLocationService();
  geolocationService: GeolocationService = new GeolocationService();

  constructor() {}

  ngAfterViewInit() {
    this.loadMap();
  }

  async loadMap() {
    const userCurrentLocation =
      await this.currentLocationService.getCurrentLocation();
    const userCurrentBuilding =
      await this.geolocationService.getCurrentBuilding(userCurrentLocation);
    console.log('user current building:\n', userCurrentBuilding);

    const mapOptions = {
      center: userCurrentLocation,
      zoom: 18,
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    new google.maps.Marker({
        position: userCurrentLocation,
        map: this.map
    });

    data.buildings.forEach((building) => {
      let polygonBuilder = new PolygonBuilder();
      polygonBuilder.setMap(this.map);
      // add building title on map here
      if (building.name == userCurrentBuilding) {
        polygonBuilder.setFillOutlineColor('#4287f5', '#074bb8');
      }
      building.boundaries.forEach((boundary) => {
        polygonBuilder.setLatLng(boundary);
      });
      polygonBuilder.build();
    });
  }
}
