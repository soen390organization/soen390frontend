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
  isDragging: boolean;
  footerContainer: ElementRef<HTMLDivElement>;
  handleBar: ElementRef<HTMLDivElement>;
  isExpanded: boolean;

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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleApiKey}&callback=initMap&libraries=marker,geometry,places&loading=async`;
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
        center: data.sgw.coordinates,
        mapId: 'nwah'
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

    const containerNode = document.getElementById('infoWindowContent')!.cloneNode(true);
    if (!(containerNode instanceof HTMLElement)) {
      throw new Error('Cloned node is not an HTMLElement');
    }
    const container = containerNode; // Now container is correctly typed as HTMLElement

    container.style.display = 'block';
    container.querySelector('#buildingName')!.textContent = building.name;
    container.querySelector('#buildingAddress')!.textContent =
      building.address ?? 'No address available';

    const facultiesDiv = container.querySelector('#buildingFaculties')!;
    facultiesDiv.innerHTML = building.faculties?.length
      ? building.faculties
          .map(
            (f: string) => `<span style="display: block; text-indent: -10px;">&#8226; ${f}</span>`
          )
          .join('')
      : 'No faculties available';

    const iconImg = container.querySelector('#buildingAccessibility') as HTMLImageElement;
    if (building.accessibility) {
      iconImg.src = building.accessibility;
      iconImg.style.display = 'inline';
    } else {
      iconImg.style.display = 'none';
    }

    this.currentInfoWindow = new google.maps.InfoWindow({
      maxWidth: 200
    });
    this.currentInfoWindow.setContent(container);
    this.currentInfoWindow.setPosition(latLng);
    this.currentInfoWindow.open(this.googleMapService.getMap());
  }
}
