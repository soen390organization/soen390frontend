/// <reference types="google.maps" />
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';
import data from 'src/assets/ConcordiaData.json';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-google-map',
  imports: [IonicModule],
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss'],
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  currentLocationService: CurrentLocationService = new CurrentLocationService();
  geolocationService: GeolocationService = new GeolocationService();
  buildingPolygon!: google.maps.Polygon;
  mapOptions: google.maps.MapOptions = {
    zoom: 18,
    mapTypeControl: false,       // Disable Map/Satellite button
    fullscreenControl: false,    // Disable Fullscreen button
    streetViewControl: false,    // Disable Street View Pegman
    zoomControl: false           // Disable Zoom control buttons
  }

  constructor(private readonly googleMapService: GoogleMapService) {}

  ngAfterViewInit() {
    this.loadGoogleMaps().then(() => {
      this.initMap();
    });
  }

  async loadGoogleMaps(): Promise<void> {
    if (typeof google !== 'undefined' && google.maps) {
      return Promise.resolve(); // Google Maps is already loaded
    }

    return new Promise((resolve) => {
      (window as any).initMap = () => resolve(); // This is the callback from the script
      const script = document.createElement('script');
      // AIzaSyApYbY5rSV5IyZJ1WMLDMM-I3M5VZQTC9g
      // AIzaSyDrpAFoOmJewkHwhFjTa8CyR_ZYGuLnEXc
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyApYbY5rSV5IyZJ1WMLDMM-I3M5VZQTC9g&callback=initMap&libraries=geometry,places';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    });
  }

  async initMap() {
    if (!this.mapContainer) return;
    this.googleMapService.setMap(new google.maps.Map(this.mapContainer.nativeElement, {
      ...this.mapOptions,
      ...(data.campuses.sgw.mapOptions as google.maps.MapOptions),
    }));
    await this.loadBuildings();
  }

  async loadBuildings() {
    const userCurrentLocation = await this.currentLocationService.getCurrentLocation();
    const userCurrentBuilding = await this.geolocationService.getCurrentBuilding(userCurrentLocation);

    data.buildings.forEach((building) => {
      let polygonBuilder = new PolygonBuilder();
      polygonBuilder.setMap(this.googleMapService.getMap());
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
