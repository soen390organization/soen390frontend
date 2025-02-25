import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { PlacesService } from 'src/app/services/places.service';

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
export class MapSearchComponent implements OnInit {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
  startLocationInput = '';
  destinationLocationInput = '';
  isSearchVisible = false;
  places: any[]=[]; // Array to store the search suggestions
  isSearchingFromStart: boolean = false; // Flag to determine if the search is for the start or destination location

  constructor(public directionsService: DirectionsService, private placesService: PlacesService) {}

  ngOnInit(): void {
    this.directionsService.getDestinationPoint().subscribe(destination => {
      this.destinationLocationInput = destination.title;
      this.isSearchVisible = true;
    });    
  }

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
  }
  
  onSetUsersLocationAsStart() {
    const currentLocationService = new CurrentLocationService();
    currentLocationService.getCurrentLocation().then((position) => {
      console.log(position)
      if (position == null) throw new Error('Current location is null.');

      this.directionsService.setStartPoint({
        title: 'Your Location',
        address: String(position.lat) + ', ' + String(position.lng),
        coordinates: new google.maps.LatLng(position)
      });
      console.log(this.directionsService.getStartPoint());
    });
  }

  async onSearchChange(event: any, type: 'start' | 'destination') {
    this.isSearchingFromStart = type === 'start'; // Set the flag to 'start' or 'destination'
    const query = event.target.value.trim(); 
    if (!query) {
      this.places = [];
      return;
    }
    this.places = await this.placesService.getPlaceSuggestions(query);
    console.log(this.places);
  }

  clearList() {
    this.places = [];
  }
}
