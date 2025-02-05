/// <reference types="google.maps" />
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';
import data from 'src/assets/ConcordiaData.json';

console.log(data);

declare var google: any;

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map!: google.maps.Map;

  constructor() {}


  ngAfterViewInit() {
    this.loadMap();
  }

  loadMap() {
    const mapOptions = {
      center: { lat: 45.49508674774648, lng: -73.57795691041848 },
      zoom: 17,
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    data.buildings.forEach((building) => {
      let polygonBuilder = new PolygonBuilder();
      polygonBuilder.setMap(this.map);
      console.log("building: ", building.name)
      building.boundaries.forEach((boundary) => {
        console.log("boundary: ", boundary)
        polygonBuilder.setLatLng({
          lat: boundary.lat,
          lng: boundary.lng,
        });
      });
      polygonBuilder.build();
    });
  }
}
