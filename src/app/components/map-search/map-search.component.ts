import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { PlacesService } from 'src/app/services/places/places.service';
import { HomePage } from 'src/app/home/home.page';
import { VisibilityService } from 'src/app/services/visibility.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { setMapType, MapType, setShowRoute } from 'src/app/store/app';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { map } from 'rxjs/operators';

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
  currentRouteData: { eta: string | null; distance: number; mode: string } | null = null;
  /* currentRouteData!: CompleteRoute | null; */
  enableStart$!: Observable<boolean>;
  isStartAndDestinationValid$: Observable<boolean>;

  public transportModes = [
    { mode: 'WALKING', icon: 'directions_walk' },
    { mode: 'TRANSIT', icon: 'directions_bus' },
    { mode: 'SHUTTLE', icon: 'directions_transit' },
    { mode: 'DRIVING', icon: 'directions_car' }
  ];

  constructor(
    private store: Store,
    public readonly outdoorDirectionsService: OutdoorDirectionsService,
    public readonly indoorDirectionService: IndoorDirectionsService,
    private readonly mappedInService: MappedinService,
    private readonly placesService: PlacesService,
    private readonly currentLocationService: CurrentLocationService,
    private readonly visibilityService: VisibilityService,
    private readonly coordinator: NavigationCoordinatorService
  ) {}

  ngOnInit(): void {
    this.enableStart$ = this.visibilityService.enableStart;

    // Combine outdoor start and destination to update input fields and show the search bar.
    combineLatest([
      this.outdoorDirectionsService.getStartPoint$(),
      this.outdoorDirectionsService.getDestinationPoint$()
    ]).subscribe(([start, destination]) => {
      if (start) {
        this.startLocationInput = start.title;
      }
      if (destination) {
        this.destinationLocationInput = destination.title;
        this.isSearchVisible = true;
      }
    });

    // When both outdoor start and destination are available, calculate the shortest route.
    combineLatest([
      this.outdoorDirectionsService.getStartPoint$(),
      this.outdoorDirectionsService.getDestinationPoint$()
    ])
      .pipe(filter(([start, destination]) => !!start && !!destination))
      .subscribe(async ([start, destination]) => {
        await this.outdoorDirectionsService
          .getShortestRoute()
          .then(strategy => {
            this.outdoorDirectionsService.setSelectedStrategy(strategy);
            this.outdoorDirectionsService.renderNavigation();
          })
          .catch((error) => console.error('Error calculating route:', error));
      });

    // Create an observable that is true when at least one start and one destination exists (outdoor or indoor) and start is enabled.
    this.isStartAndDestinationValid$ = combineLatest([
      this.outdoorDirectionsService.getStartPoint$(),
      this.outdoorDirectionsService.getDestinationPoint$(),
      this.indoorDirectionService.getStartPoint$(),
      this.indoorDirectionService.getDestinationPoint$(),
      this.visibilityService.enableStart
    ]).pipe(
      map(
        ([outdoorStart, outdoorDest, indoorStart, indoorDest, enableStart]) =>
          (!!outdoorStart || !!indoorStart) && (!!outdoorDest || !!indoorDest) && enableStart
      )
    );
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
    this.outdoorDirectionsService.setStartPoint({
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
    this.visibilityService.toggleDirectionsComponent();
    this.visibilityService.togglePOIsComponent();
    this.visibilityService.toggleStartButton();
    this.toggleSearch();

    // Get indoor selections as observables.
    // const indoorStart$ = this.indoorDirectionService.getStartPoint();
    // const indoorDestination$ = this.indoorDirectionService.getDestinationPoint();

    // PROPOSED CHANGES
    combineLatest([
      this.indoorDirectionService.getStartPoint$(),
      this.indoorDirectionService.getDestinationPoint$(),
      this.outdoorDirectionsService.getStartPoint$(),
      this.outdoorDirectionsService.getDestinationPoint$()
    ])
    .subscribe(async ([indoorStart, indoorDestination, outdoorStart, outdoorDestination]) => {
      // Render selected Strategy***


      // if (outdoorStart && outdoorDestination) {
      //   this.outdoorDirectionsService.generateRoute(outdoorStart.address, outdoorDestination.address);
      // } else if (outdoorStart && indoorDestination) {
      //   this.outdoorDirectionsService.generateRoute(outdoorStart.address, indoorDestination.address);
      // } else if (indoorStart && outdoorDestination) {
      //   if (indoorStart.indoorMapId !== this.mappedInService.getMapId()) {
      //     await this.mappedInService.setMapData(indoorStart.indoorMapId);
      //   }
      //   this.outdoorDirectionsService.generateRoute(indoorStart.address, outdoorDestination.address);
      // } else if (indoorStart && indoorDestination && indoorStart.address !== indoorDestination.address) {
      //   if (indoorStart.indoorMapId !== this.mappedInService.getMapId()) {
      //     await this.mappedInService.setMapData(indoorStart.indoorMapId);
      //   }
      //   this.outdoorDirectionsService.generateRoute(indoorStart.address, indoorDestination.address);
      // }
    });

    // combineLatest([indoorStart$, indoorDestination$])
    //   .pipe(
    //     map(([s, d]) => ({ s, d })),
    //     take(1)
    //   )
    //   .subscribe(({ s, d }) => {
    //     if (s && d && s.indoorMapId && d.indoorMapId) {
    //       // Delegate indoor routing to the coordinator.
    //       console.log('Indoor navigation requested:', s, d);
    //       this.coordinator
    //         .getCompleteRoute(s, d, 'WALKING')
    //         .then((completeRoute) => {
    //           console.log('Indoor navigation complete route:', completeRoute);
    //           // The indoor strategy is expected to handle route drawing.
    //         })
    //         .catch((error) => console.error('Error rendering indoor navigation:', error));
    //     } else {
    //       // Fallback: use outdoor directions.
    //       console.error('Indoor routing not available. Fallback to outdoor routing.');
    //     }
    //   });
  }

  clearStartInput() {
    // this.store.dispatch(setShowRoute({ show: false }));
    this.startLocationInput = '';
    this.clearList();
    this.outdoorDirectionsService.clearStartPoint();
    this.outdoorDirectionsService.clearNavigation();
    this.mappedInService.clearNavigation();
    this.indoorDirectionService.clearStartPoint();
    this.currentRouteData = null;
    this.visibilityService.triggerEndNavigation();
  }

  clearDestinationInput() {
    // this.store.dispatch(setShowRoute({ show: false }));
    this.destinationLocationInput = '';
    this.clearList();
    this.outdoorDirectionsService.clearDestinationPoint();
    this.outdoorDirectionsService.clearNavigation();
    this.mappedInService.clearNavigation();
    this.indoorDirectionService.clearDestinationPoint();
    this.currentRouteData = null;
    this.visibilityService.triggerEndNavigation();
  }

  public getTransportIcon(): string {
    if (!this.currentRouteData || !this.currentRouteData.mode) {
      return '';
    }
    const mapping = this.transportModes.find((item) => item.mode === this.currentRouteData.mode);
    return mapping ? mapping.icon : '';
  }

  /* @TODO: we need to setFloor here for a better experience */
  async setStart(place: any) {
    this.startLocationInput = place.title;
    if (place.type === 'indoor') {
      console.log('Setting start point for indoor:', place);
      this.indoorDirectionService.setStartPoint(place);
      this.outdoorDirectionsService.setStartPoint({
        title: place.fullName,
        address: place.address,
        type: 'outdoor'
      });
      this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
      if (place.indoorMapId !== this.mappedInService.getMapId()) {
        await this.mappedInService.setMapData(place.indoorMapId);
      }
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
        type: 'outdoor'
      });
      this.store.dispatch(setMapType({ mapType: MapType.Indoor }));
      if (place.indoorMapId !== this.mappedInService.getMapId()) {
        await this.mappedInService.setMapData(place.indoorMapId);
      }
    } else {
      this.outdoorDirectionsService.setDestinationPoint(place);
      this.store.dispatch(setMapType({ mapType: MapType.Outdoor }));
    }
    this.places = [];
  }
}
