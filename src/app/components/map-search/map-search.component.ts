import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { PlacesService } from 'src/app/services/places/places.service';
import { combineLatest } from 'rxjs';
import { Store } from '@ngrx/store';
import { setMapType, MapType, setShowRoute, selectShowRoute } from 'src/app/store/app';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { HomePage } from 'src/app/home/home.page';

export const MapSearchAnimation = [
  trigger('slideInOut', [
    state(
      'in',
      style({
        width: '100%',
        opacity: 1,
        transform: 'translateX(0)'
      })
    ),
    state(
      'out',
      style({
        width: '0px',
        opacity: 0,
        transform: 'translateX(-100%)'
      })
    ),
    transition('out => in', animate('0.15s ease-in-out')),
    transition('in => out', animate('0.15s ease-in-out'))
  ])
];

@Component({
  selector: 'app-map-search',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './map-search.component.html',
  styleUrls: ['./map-search.component.scss'],
  animations: MapSearchAnimation
})
export class MapSearchComponent implements OnInit {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
  startLocationInput = '';
  destinationLocationInput = '';
  isSearchVisible = false;
  places: any[] = []; // Array to store the search suggestions
  isSearchingFromStart: boolean = false; // Flag to determine if the search is for the start or destination location
  disableStart: boolean = true;

  constructor(
    private store: Store,
    private googleMapService: GoogleMapService,
    public readonly outdoorDirectionsService: OutdoorDirectionsService,
    public readonly indoorDirectionService: IndoorDirectionsService,
    private readonly mappedInService: MappedinService,
    private readonly placesService: PlacesService,
    private readonly currentLocationService: CurrentLocationService
  ) {}

  ngOnInit(): void {
    this.store.select(selectShowRoute).subscribe(showRoute => {
      if (showRoute) {
        this.disableStart = true;
      } else {
        this.disableStart = false;
      }
    });

    combineLatest([
      this.outdoorDirectionsService.getStartPoint$(),
      this.outdoorDirectionsService.getDestinationPoint$(),
      this.indoorDirectionService.getStartPoint$(),
      this.indoorDirectionService.getDestinationPoint$()
    ]).subscribe(async ([outdoorStartPoint, outdoorDestinationPoint, indoorStartPoint, indoorDestinationPoint]) => {
      if (outdoorStartPoint) {
        this.startLocationInput = outdoorStartPoint.title;
        this.outdoorDirectionsService.showStartMarker();
        this.googleMapService.updateMapLocation(outdoorStartPoint.coordinates);
      }

      if (outdoorDestinationPoint) {
        this.destinationLocationInput = outdoorDestinationPoint.title;
        this.outdoorDirectionsService.showDestinationMarker();
        this.googleMapService.updateMapLocation(outdoorDestinationPoint.coordinates);
      }

      // Render indoor
      if (outdoorStartPoint && outdoorDestinationPoint) {
        await this.outdoorDirectionsService
        .getShortestRoute()
        .then(strategy => {
          this.outdoorDirectionsService.setSelectedStrategy(strategy);
          this.outdoorDirectionsService.clearStartMarker();
          this.outdoorDirectionsService.clearDestinationMarker();
          this.outdoorDirectionsService.renderNavigation();
          this.disableStart = false;
        })
        return;
      } else if (indoorStartPoint && indoorDestinationPoint) {
        this.disableStart = false;
        return;
      } else {
        this.disableStart = true;
      }
    })
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
    console.log('Position: ', position)
    if (position == null) {
      throw new Error('Current location is null.');
    }
    this.setStart({
      title: 'Your Location',
      address: `${position.lat}, ${position.lng}`,
      coordinates: new google.maps.LatLng(position),
      type: 'outdoor'
    });
    this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
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

  async onStartClick(): Promise<void> {
    this.store.dispatch(setShowRoute({ show: true }));
    this.isSearchVisible = false;
  }

  clearStartInput() {
    this.clearLocation();
    this.outdoorDirectionsService.clearStartMarker();
    this.outdoorDirectionsService.clearStartPoint();
    this.indoorDirectionService.clearStartPoint();
    this.startLocationInput = '';
  }

  clearDestinationInput() {
    this.clearLocation();
    this.outdoorDirectionsService.clearDestinationMarker();
    this.outdoorDirectionsService.clearDestinationPoint();
    this.indoorDirectionService.clearDestinationPoint();
    this.destinationLocationInput = '';
  }

  clearLocation() {
    this.clearList();
    this.store.dispatch(setShowRoute({ show: false }));
    this.outdoorDirectionsService.clearNavigation();
    this.outdoorDirectionsService.setSelectedStrategy(null);
    this.indoorDirectionService.clearNavigation();
  }

  /* @TODO: we need to setFloor here for a better experience */
  async setStart(place: any) {
    console.log(place);
    this.startLocationInput = place.title;
    if (place.type === 'indoor') {
      console.log('Setting start point for indoor:', place);
      this.indoorDirectionService.setStartPoint(place);
      this.outdoorDirectionsService.setStartPoint({
        title: place.fullName,
        address: place.address,
        coordinates: place.coordinates,
        type: 'outdoor'
      });

      if (place.indoorMapId !== this.mappedInService.getMapId()) {
        await this.mappedInService.setMapData(place.indoorMapId);
      }
      this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
    } else {
      this.outdoorDirectionsService.setStartPoint(place);
      this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
    }
    this.places = [];
  }

  async setDestination(place: any) {
    this.destinationLocationInput = place.title;
    if (place.type === 'indoor') {
      this.indoorDirectionService.setDestinationPoint(place);
      this.outdoorDirectionsService.setDestinationPoint({
        title: place.fullName,
        address: place.address,
        coordinates: place.coordinates,
        type: 'outdoor'
      });

      if (place.indoorMapId !== this.mappedInService.getMapId()) {
        await this.mappedInService.setMapData(place.indoorMapId);
      }
      this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
    } else {
      this.outdoorDirectionsService.setDestinationPoint(place);
      this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
    }
    this.places = [];
  }
}
