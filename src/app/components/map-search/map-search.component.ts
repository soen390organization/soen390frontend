import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentLocationService } from 'src/app/services/geolocation/current-location.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { PlacesService } from 'src/app/services/places.service';
import { HomePage } from 'src/app/home/home.page';
import { VisibilityService } from 'src/app/services/visibility.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export const MapSeachAnimation = [
  trigger('slideInOut', [
    state(
      'in',
      style({
        width: '100%',
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
]

@Component({
  selector: 'app-map-search',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './map-search.component.html',
  styleUrls: ['./map-search.component.scss'],
  animations: MapSeachAnimation
})

export class MapSearchComponent implements OnInit {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
  startLocationInput = '';
  destinationLocationInput = '';
  isSearchVisible = false;
  places: any[] = []; // Array to store the search suggestions
  isSearchingFromStart: boolean = false; // Flag to determine if the search is for the start or destination location
  currentRouteData: { eta: string | null; distance: number } | null = null;
  enableStart$!: Observable<boolean>;

  constructor(
    public readonly directionsService: DirectionsService,
    private readonly placesService: PlacesService,
    private readonly currentLocationService: CurrentLocationService,
    private readonly visibilityService: VisibilityService) {}

  ngOnInit(): void {
    this.enableStart$ = this.visibilityService.enableStart;
    this.directionsService.getStartPoint().subscribe(start => {
      if (start) {
        this.startLocationInput = start.title;
      }
    });
    this.directionsService.getDestinationPoint().subscribe(destination => {
      if (destination) {
        this.destinationLocationInput = destination.title;
        this.isSearchVisible = true;
      }
    });

    combineLatest([
      this.directionsService.getStartPoint(),
      this.directionsService.getDestinationPoint()
    ])
    .pipe(
      filter(([start, destination]) => !!start && !!destination)
    )
    .subscribe(([start, destination]) => {
      // Use the available start and destination values.
      // Here we assume calculateShortestRoute accepts addresses; adjust if you prefer coordinates.
      this.directionsService.calculateShortestRoute(start!.address, destination!.address)
        .then(() => {
          // Retrieve the calculated fastest route data from the service.
          this.currentRouteData = this.directionsService.getShortestRoute();
        })
        .catch(error => console.error('Error calculating route:', error));
    });

  }

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
    if (this.isSearchVisible) {
      HomePage.prototype.showSearch();
    } else {
      HomePage.prototype.hideSearch();
    }
  }

  async onSetUsersLocationAsStart(): Promise<void> {
    const position = await this.currentLocationService.getCurrentLocation();
    if (position == null) {
      throw new Error('Current location is null.');
    }
    this.directionsService.setStartPoint({
      title: 'Your Location',
      address: `${position.lat}, ${position.lng}`,
      coordinates: new google.maps.LatLng(position),
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
  }

  clearList() {
    this.places = [];
  }

  onStartClick(): void {
    this.visibilityService.toggleDirectionsComponent();
    this.visibilityService.togglePOIsComponent();
    this.directionsService.showDirections();
    this.visibilityService.toggleStartButton();
    this.toggleSearch();

  }

  clearStartInput() {
    this.startLocationInput = '';
    this.clearList();
    this.directionsService.clearStartPoint();
    this.currentRouteData = null;
  }


  clearDestinationInput() {
    this.destinationLocationInput = '';
    this.clearList();
    this.directionsService.clearDestinationPoint();
    this.currentRouteData = null;
  }
}
