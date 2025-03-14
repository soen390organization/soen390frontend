/// <reference types="google.maps" />
import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { PolygonBuilder } from 'src/app/builders/polygon.builder';
import data from 'src/assets/concordia-data.json';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { IonicModule } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-google-map',
  imports: [IonicModule],
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss']
})
export class GoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @Output() initialized = new EventEmitter<void>();
  currentLocationService: CurrentLocationService = new CurrentLocationService();
  geolocationService: GeolocationService = new GeolocationService();
  buildingPolygon!: google.maps.Polygon;
  mapOptions: google.maps.MapOptions = {
    zoom: 18,
    mapTypeControl: false, // Disable Map/Satellite button
    fullscreenControl: false, // Disable Fullscreen button
    streetViewControl: false, // Disable Street View Pegman
    zoomControl: false // Disable Zoom control buttons
  };

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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleApiKey}&callback=initMap&libraries=geometry,places&loading=async`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    });
  }

  async initMap() {
    if (!this.mapContainer) return;
    this.googleMapService.initialize(
      new google.maps.Map(this.mapContainer.nativeElement, {
        ...this.mapOptions,
        center: data.sgw.coordinates
      })
    );
    await this.loadBuildings();
    this.initialized.emit();
    console.log('Google Map initialized: ', this.initialized);
  }

  async loadBuildings() {
    const userCurrentLocation = await this.currentLocationService.getCurrentLocation();
    const userCurrentBuilding =
      await this.geolocationService.getCurrentBuilding(userCurrentLocation);

    const buildings = [...data.sgw.buildings, ...data.loy.buildings];

    buildings.forEach((building) => {
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
