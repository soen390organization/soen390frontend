/// <reference types="google.maps" />
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';
import data from 'src/assets/ConcordiaData.json';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { IonicModule } from '@ionic/angular';

declare const google: any;

@Component({
  selector: 'app-google-map',
  imports: [IonicModule],
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map!: google.maps.Map;
  currentLocationService: CurrentLocationService = new CurrentLocationService();
  geolocationService: GeolocationService = new GeolocationService();
  buildingPolygon!: google.maps.Polygon;
  mapOptions: google.maps.MapOptions = {
    zoom: 18
  }
  selectedCampus = 'SGW';

  constructor() {}

  ngAfterViewInit() {
    this.loadSGW();
  }

  switchCampus() {
    if (this.selectedCampus === 'SGW')
      this.loadLoyola();
    else
      this.loadSGW();
  }

  async loadSGW() {
    this.selectedCampus = 'SGW';
    // SGW: 45.49508674774648, -73.57795691041848
    const mapOptions = {
      ...this.mapOptions,
      center: { lat: 45.49508674774648, lng: -73.57795691041848 },
    };
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
    await this.loadBuildings();
  }

  async loadLoyola() {
    this.selectedCampus = 'LOY';
    // Loyola: 45.45812810976341, -73.6393513063634
    const mapOptions = {
      ...this.mapOptions,
      center: { lat: 45.45812810976341, lng: -73.6393513063634 },
    };
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
    await this.loadBuildings();
  }

  async loadBuildings() {
    const userCurrentLocation = await this.currentLocationService.getCurrentLocation();
    const userCurrentBuilding = await this.geolocationService.getCurrentBuilding(userCurrentLocation);
    console.log('user current building:\n', userCurrentBuilding);

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
