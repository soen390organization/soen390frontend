import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { GoogleMapService } from 'src/app/services/googeMap.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';


@Component({
  selector: 'app-map-search',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './map-search.component.html',
  styleUrls: ['./map-search.component.scss'],
  animations: [
    trigger('slideInOut', [
      state(
        'in',
        style({
          width: '360px',
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      state(
        'out',
        style({
          width: '0px',
          opacity: 0,
          transform: 'translateX(-100%)',
        })
      ),
      transition('out => in', animate('0.15s ease-in-out')),
      transition('in => out', animate('0.15s ease-in-out')),
    ]),
  ],
})
export class MapSearchComponent implements OnInit, OnDestroy{
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
startMarker: google.maps.Marker | null = null;
  destinationMarker: google.maps.Marker | null = null;
  startLocationInput = '';
  startLocation: { address: string; coordinates: google.maps.LatLng, marker: google.maps.Marker } | undefined
  destinationLocationInput = '';
  places: any[]=[];
  query: string;
  isSearchingFromStart: boolean = false;
  destinationLocation: { address: string; coordinates: google.maps.LatLng, marker: google.maps.Marker  } | undefined
  isSearchVisible = false;


  constructor(private googleMapService: GoogleMapService, private zone: NgZone) {}

  ngOnInit(): void {
    console.log('ngOnInit called');
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy called');
  }
  
  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
  }
  
  onSetUsersLocationAsStart() {
    const currentLocationService = new CurrentLocationService();
    currentLocationService.getCurrentLocation()
      .then((position) => {
        if (position == null)
          throw new Error('Current location is null.');

        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ location: position }, (results, status) => {
          if (results == null)
            throw new Error("Current location's address cannot be read.");

          const result = results[0];
          this.startLocation = {
            address: result.formatted_address,
            coordinates: result.geometry.location,
            marker: this.startLocation?.marker ?? this.createMarker(result.geometry.location, 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg')
          }
          this.startLocation.marker.setPosition(result.geometry.location);
          this.startLocationInput = 'Your Location';
          this.updateMapView();
        })
      })
  }

  async onSearchChange(event: any, type: 'start' | 'destination') {
    this.isSearchingFromStart = type === 'start'; // Set the flag to 'start' or 'destination'
    this.query = event.target.value.trim(); 
    if (!this.query) {
      this.clearPlaces();
      return;
    }
    await this.getPlaces(); 
  }

  async onSearchFromInput(value: string, event: any, type: 'start' | 'destination') {
    let searchTerm = value || event?.target?.value?.trim();
    if (!searchTerm) return; // Prevent empty search
    this.clearPlaces();
    
    if(type === 'start'){   
      const result = await this.findPlace(searchTerm);
      this.startLocation = {
        address: result.formatted_address,
        coordinates: result.geometry.location,
        marker: this.startLocation?.marker ?? this.createMarker(result.geometry.location, 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Icone_Verde.svg')
      }
      this.startLocation.marker.setPosition(result.geometry.location);
      if (this.destinationLocation)
        this.googleMapService.calculateRoute(this.startLocation.address, this.destinationLocation.address); 
    
    } else{

      const result = await this.findPlace(searchTerm);
      this.destinationLocation = {
        address: result.formatted_address,
        coordinates: result.geometry.location,
        marker: this.destinationLocation?.marker ?? this.createMarker(result.geometry.location, 'https://upload.wikimedia.org/wikipedia/commons/6/64/Icone_Vermelho.svg')
      }
      this.destinationLocation.marker.setPosition(result.geometry.location);
      if (this.startLocation)
        this.googleMapService.calculateRoute(this.startLocation.address, this.destinationLocation.address);

    }
      this.updateMapView();
  }   

  clearPlaces() {
    this.places = [];
  }

  selectPlace(place: any, type: 'start' | 'destination') {
    if (type === 'start') {
      this.startLocationInput = place.address;
    } else {
      this.destinationLocationInput = place.address;
    }
    this.clearPlaces(); // Hide suggestions
    this.onSearchFromInput(place.address, null, type);
  }
  

  async getPlaces(){
    console.log('getPlaces method called');
    try{
      let service = new google.maps.places.AutocompleteService();
      console.log('Searching for:', this.query);
      service.getPlacePredictions({
        input:this.query,
                componentRestrictions:{
          country: 'CA'
        }
    }, (predictions) => {
        let autoCompleteItems = [];
        this.zone.run(() => {
          if (predictions) {
            predictions.forEach(async (prediction) => {
              console.log('prediction: ', prediction);
              let latLng: any = await this.geoCode(prediction.description);
              const places = {
                title: prediction.structured_formatting.main_text,
                address: prediction.description,
                lat: latLng.lat,
                lng: latLng.lng,
              };
              console.log('places: ', places);
              autoCompleteItems.push(places);
            });
            this.places = autoCompleteItems; 
            console.log(this.places) // Ensure this updates correctly.
          }
        });        
  });
    } catch(e){
      console.log("Cannot get places. "+e)

    }

  }

  geoCode(address: any) {
    let latlng = {lat: '', lng: ''};
    return new Promise((resolve,reject) => {
      let geocoder = new google.maps.Geocoder();
      geocoder.geocode({'address' : address}, (results) => {
        console.log('results: ', results);
        if(results && results.length >0) {
        latlng.lat = results[0].geometry.location.lat().toString();
        latlng.lng = results[0].geometry.location.lng().toString();
        resolve(latlng);
        }
      });
    });
  }

  findPlace(searchTerm: string): Promise<any> {
    return new Promise((resolve, reject) => {
    const request = {
      query: searchTerm,
      fields: ['geometry', 'formatted_address']
    };

    const placesService = new google.maps.places.PlacesService(this.googleMapService.getMap());

    placesService.findPlaceFromQuery(request, (results: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        resolve(results[0]);
            } else {
              reject(null);
        }
      });
    });
  }

  createMarker(position: google.maps.LatLng, iconUrl: string): google.maps.Marker {
    return new google.maps.Marker({
      position,
      map: this.googleMapService.getMap(),
      icon: { url: iconUrl, scaledSize: new google.maps.Size(40, 40) }
    });
  }

  updateMapView() {
    const map = this.googleMapService.getMap();
    if (this.startLocation && this.destinationLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(this.startLocation?.marker.getPosition()!);
      bounds.extend(this.destinationLocation?.marker.getPosition()!);
      map.fitBounds(bounds);
    } else if (this.startLocation) {
      map.setCenter(this.startLocation?.marker.getPosition()!);
      map.setZoom(15);
    } else if (this.destinationLocation) {
      map.setCenter(this.destinationLocation?.marker.getPosition()!);
      map.setZoom(15);
    }
  }
}
