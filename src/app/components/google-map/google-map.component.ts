/// <reference types="google.maps" />
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';
import data from 'src/assets/ConcordiaData.json';

declare var google: any;

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map!: google.maps.Map;

  constructor() { }

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
      // add building title on map here
      building.boundaries.forEach((boundary) => {
        polygonBuilder.setLatLng(
          boundary
        );
      });
      polygonBuilder.build();
    });
  }
}
