/// <reference types="google.maps" />
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';

declare var google: any;

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss']
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map!: google.maps.Map;
  buildingPolygon!: google.maps.Polygon;

  constructor(private polygonBuilder: PolygonBuilder) {}

  ngAfterViewInit() {
    this.loadMap();
  }

  updateMapLocation(location: google.maps.LatLng) { 
    this.map.setCenter(location);
    this.map.setZoom(15);
  }

  loadMap() {
    const mapOptions = {
      center: { lat: 45.49508674774648, lng: -73.57795691041848 },
      zoom: 18
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
    this.polygonBuilder
      .setMap(this.map)
      .setLatLng({ lat: 45.495591079071204, lng: -73.57875848203057 })
      .setLatLng({ lat: 45.49586589655901, lng: -73.57849857884187 })
      .setLatLng({ lat: 45.49568062648983, lng: -73.57807568551792 })
      .setLatLng({ lat: 45.496048078199344, lng: -73.57771005899824 })
      .setLatLng({ lat: 45.49583193042529, lng: -73.57724751942516 })
      .setLatLng({ lat: 45.49518965785853, lng: -73.57789507482747 })
      .build();
  }
}
