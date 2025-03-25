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

  currentInfoWindow: google.maps.InfoWindow | null = null;

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
      const polygon = polygonBuilder.build();

      polygon.addListener('click', (event) => {
        this.showInfoWindow(building, event.latLng);
      });

      this.googleMapService.getMap().addListener('click', () => {
        if (this.currentInfoWindow) {
          this.currentInfoWindow.close(); 
          this.currentInfoWindow = null;  
        }
      });
    });
  }

  showInfoWindow(building: any, latLng: google.maps.LatLng) {
  if (this.currentInfoWindow) {
    this.currentInfoWindow.close();
  }
  const contentString = `
    <div style="font-family: Arial, sans-serif;">
      <div style="display: flex; vertical-align: middle; align-items: center;">
        <div><ion-icon name="information-circle-outline" style="font-size: 33px; color:rgb(0, 0, 0); font-weight: 600"></ion-icon></div>
        <div><div style="color: #2a3d56; padding-left: 4px; font-size: 15px; font-weight: 600; text-align: left;">${building.name}</div></div>
      </div>
      <div style="text-align: left;padding-left:5px;">
        <h2 style="color: #555;margin-bottom: 5px;">${building.address || 'No address available'}</h2>
        <p style="color: #912338; font-weight: 600; margin-bottom: 3px;"> Faculties</p>
        <p style="color: #555; margin: 0; padding-left: 10px;">
          ${building.faculties 
            ? building.faculties.map(faculty => `<span style="display: block; text-indent: -10px;">&#8226; ${faculty}</span>`).join('') 
            : 'No faculties available'}
        </p>
    </div>
          </div>
        <div style="position: absolute; bottom: 10px; right: 5px;">
          ${building.accessibility ? `<img src="${building.accessibility}" alt="information icon" style="width: 25px; height: 25px; object-fit: contain;">`
          : ''}
        </div>
  `;

  this.currentInfoWindow = new google.maps.InfoWindow({
    content: contentString,
    maxWidth: 200 

  });
  this.currentInfoWindow.setContent(contentString);
  this.currentInfoWindow.setPosition(latLng);
  this.currentInfoWindow.open(this.googleMapService.getMap());
  const style = document.createElement('style');
  style.innerHTML = `
    .gm-style-iw button {
      display: none !important;
    }
      .gm-style-iw.gm-style-iw-c {
    border-radius: 24px;
    }
  `;
  document.head.appendChild(style);

}

}
