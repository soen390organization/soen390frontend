/// <reference types="google.maps" />
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';
import { IonicModule } from '@ionic/angular';

declare var google: any;

@Component({
  selector: 'app-google-map',
  imports: [IonicModule],
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss']
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map!: google.maps.Map;
  buildingPolygon!: google.maps.Polygon;
  mapOptions: any = {
    zoom: 18
  }
  selectedCampus = 'SGW';

  constructor(private polygonBuilder: PolygonBuilder) {}

  ngAfterViewInit() {
    this.loadSGW();
  }

  switchCampus() {
    if (this.selectedCampus === 'SGW')
      this.loadLoyola();
    else
      this.loadSGW();
  }

  loadSGW() {
    this.selectedCampus = 'SGW';
    // SGW: 45.49508674774648, -73.57795691041848
    const mapOptions = {
      ...this.mapOptions,
      center: { lat: 45.49508674774648, lng: -73.57795691041848 },
    };
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    // this.polygonBuilder
    //   .setMap(this.map)
    //   .setLatLng({ lat: 45.495591079071204, lng: -73.57875848203057 })
    //   .setLatLng({ lat: 45.49586589655901, lng: -73.57849857884187 })
    //   .setLatLng({ lat: 45.49568062648983, lng: -73.57807568551792 })
    //   .setLatLng({ lat: 45.496048078199344, lng: -73.57771005899824 })
    //   .setLatLng({ lat: 45.49583193042529, lng: -73.57724751942516 })
    //   .setLatLng({ lat: 45.49518965785853, lng: -73.57789507482747 })
    //   .build();
  }

  loadLoyola() {
    this.selectedCampus = 'LOY';
    // Loyola: 45.45812810976341, -73.6393513063634
    const mapOptions = {
      ...this.mapOptions,
      center: { lat: 45.45812810976341, lng: -73.6393513063634 },
    };
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
  }
}
