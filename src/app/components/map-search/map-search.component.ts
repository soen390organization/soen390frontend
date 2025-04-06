import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
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
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';

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
  @Output() searchStateChange = new EventEmitter<boolean>();
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;

  startLocationInput = '';
  destinationLocationInput = '';
  isSearchVisible = false;
  disableStart: boolean = true;
  // Single unified suggestions array for both inputs.
  places: any[] = [];
  isSearchingFromStart: boolean = false; // Indicates which input is active
  startInputFocused = false;
  destinationInputFocused = false;

  constructor(
    private store: Store,
    private readonly googleMapService: GoogleMapService,
    public readonly outdoorDirectionsService: OutdoorDirectionsService,
    public readonly indoorDirectionService: IndoorDirectionsService,
    private readonly mappedInService: MappedinService,
    private readonly placesService: PlacesService,
    private readonly currentLocationService: CurrentLocationService,
    private readonly concordiaDataService: ConcordiaDataService
  ) {}

  ngOnInit(): void {
    this.store.select(selectShowRoute).subscribe((showRoute) => {
      this.setDisableStart(showRoute);
    });

    combineLatest([
      this.outdoorDirectionsService.getStartPoint$(),
      this.outdoorDirectionsService.getDestinationPoint$(),
      this.indoorDirectionService.getStartPoint$(),
      this.indoorDirectionService.getDestinationPoint$()
    ]).subscribe(
      async ([
        outdoorStartPoint,
        outdoorDestinationPoint,
        indoorStartPoint,
        indoorDestinationPoint
      ]) => {
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
        if (outdoorStartPoint && outdoorDestinationPoint) {
          await this.outdoorDirectionsService.getShortestRoute().then((strategy) => {
            this.outdoorDirectionsService.setSelectedStrategy(strategy);
            this.outdoorDirectionsService.clearStartMarker();
            this.outdoorDirectionsService.clearDestinationMarker();
            this.outdoorDirectionsService.renderNavigation();
            this.disableStart = false;
          });
        } else if (indoorStartPoint || indoorDestinationPoint) {
          await this.indoorDirectionService.getInitializedRoutes().then(async (strategy) => {
            this.indoorDirectionService.setSelectedStrategy(strategy);
            this.indoorDirectionService.renderNavigation();
            this.disableStart = false;
          });
        } else {
          this.disableStart = true;
        }
      }
    );

    // Optionally attempt to set user's current location as default start.
    this.setUserLocationAsDefaultStart();
  }

  private async setUserLocationAsDefaultStart(): Promise<void> {
    try {
      const position = await this.currentLocationService.getCurrentLocation();
      if (position) {
        const currentLocation = new google.maps.LatLng(position);
        const place = {
          title: 'Your Location',
          address: `${position.lat}, ${position.lng}`,
          coordinates: currentLocation,
          type: 'outdoor'
        };
        this.setStart(place);
        this.googleMapService.updateMapLocation(currentLocation);
      }
    } catch (error) {
      console.warn('Could not fetch user location on init:', error);
    }
  }

  private setDisableStart(show: boolean) {
    this.disableStart = show;
  }

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
    this.searchStateChange.emit(this.isSearchVisible);
    if (this.isSearchVisible) {
      HomePage.prototype.showSearch();
    } else {
      HomePage.prototype.hideSearch();
    }
  }

  async setUserLocation(type: 'start' | 'destination'): Promise<void> {
    try {
      const position = await this.currentLocationService.getCurrentLocation();
      if (!position) {
        throw new Error('Current location is null.');
      }

      const place = {
        title: 'Your Location',
        address: `${position.lat}, ${position.lng}`,
        coordinates: new google.maps.LatLng(position),
        type: 'outdoor'
      };

      if (type === 'start') {
        this.setStart(place);
      } else {
        this.setDestination(place);
      }

      this.googleMapService.updateMapLocation(place.coordinates);
      this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
    } catch (error) {
      console.warn('Could not fetch user location:', error);
    }
  }

  async onSearchChange(event: any, type: 'start' | 'destination') {
    this.isSearchingFromStart = type === 'start';
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
    this.searchStateChange.emit(false);
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

  async onFocus(type: 'start' | 'destination'): Promise<void> {
    this.isSearchingFromStart = type === 'start';
    // Retrieve default building suggestions.
    const suggestions = await this.placesService.getPlaceSuggestions('');
    // Prepend the custom "Your Location" suggestion for both inputs.
    this.places = [
      {
        title: 'Your Location',
        address: 'Use your current location',
        type: 'outdoor',
        isYourLocation: true
      },
      ...suggestions
    ];
  }

  handleBlur(type: 'start' | 'destination') {
    if (type === 'start') {
      this.startInputFocused = false;
    } else {
      this.destinationInputFocused = false;
    }

    // Delay to allow click events on suggestions
    setTimeout(() => {
      if (!this.startInputFocused && !this.destinationInputFocused) {
        this.clearList();
      }
    }, 200);
  }

  async setStart(place: any) {
    if (place.isYourLocation) {
      await this.setUserLocation('start');
      this.clearList();
      return;
    }
    this.startLocationInput = place.title;
    if (place.type === 'indoor') {
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
    this.clearList();
  }

  async setDestination(place: any) {
    if (place.isYourLocation) {
      await this.setUserLocation('destination');
      this.clearList();
      return;
    }
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
    this.clearList();
  }

  getPlaceIcon(title: string | undefined): string {
    return this.isHighlighted(title) ? 'location_city' : 'location_on';
  }

  isHighlighted(title: string | undefined): boolean {
    if (!title) return false;
    return this.concordiaDataService.getHighlightedBuildings().has(title);
  }
}
