import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MapSearchComponent } from './map-search.component';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { PlacesService } from 'src/app/services/places/places.service';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { MapType } from 'src/app/store/app';

describe('MapSearchComponent', () => {
  let component: MapSearchComponent;
  let fixture: ComponentFixture<MapSearchComponent>;
  let mockOutdoor: jasmine.SpyObj<OutdoorDirectionsService>;
  let mockIndoor: jasmine.SpyObj<IndoorDirectionsService>;
  let mockMappedin: jasmine.SpyObj<MappedinService>;
  let mockPlaces: jasmine.SpyObj<PlacesService>;
  let mockLocation: jasmine.SpyObj<CurrentLocationService>;
  let mockStore: jasmine.SpyObj<Store>;

  beforeEach(async () => {
    mockOutdoor = jasmine.createSpyObj('OutdoorDirectionsService', [
      'getStartPoint$', 'getDestinationPoint$', 'getShortestRoute',
      'setSelectedStrategy', 'renderNavigation', 'setStartPoint',
      'clearDestinationPoint', 'clearNavigation', 'setDestinationPoint'
    ]);
    mockIndoor = jasmine.createSpyObj<IndoorDirectionsService>('IndoorDirectionsService', [], {
      getStartPoint$: () => of(null),
      getDestinationPoint$: () => of(null)
    });
    mockMappedin = jasmine.createSpyObj('MappedinService', ['getMapId', 'setMapData', 'clearNavigation']);
    mockPlaces = jasmine.createSpyObj('PlacesService', ['getPlaceSuggestions']);
    mockLocation = jasmine.createSpyObj('CurrentLocationService', ['getCurrentLocation']);
    mockStore = jasmine.createSpyObj('Store', ['dispatch']);

    await TestBed.configureTestingModule({
      imports: [FormsModule, IonicModule, CommonModule],
      declarations: [MapSearchComponent],
      providers: [
        { provide: OutdoorDirectionsService, useValue: mockOutdoor },
        { provide: IndoorDirectionsService, useValue: mockIndoor },
        { provide: MappedinService, useValue: mockMappedin },
        { provide: PlacesService, useValue: mockPlaces },
        { provide: CurrentLocationService, useValue: mockLocation },
        { provide: Store, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapSearchComponent);
    component = fixture.componentInstance;

    mockOutdoor.getStartPoint$.and.returnValue(of(null));
    mockOutdoor.getDestinationPoint$.and.returnValue(of(null));
    mockIndoor.getStartPoint$.and.returnValue(of(null));
    mockIndoor.getDestinationPoint$.and.returnValue(of(null));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle search visibility', () => {
    expect(component.isSearchVisible).toBe(false);
    component.toggleSearch();
    expect(component.isSearchVisible).toBe(true);
  });

  it('should clear place list', () => {
    component.places = [{}];
    component.clearList();
    expect(component.places.length).toBe(0);
  });

  it('should clear inputs and locations', () => {
    component.startLocationInput = 'test';
    component.destinationLocationInput = 'test';

    component.clearStartInput();
    expect(component.startLocationInput).toBe('');

    component.clearDestinationInput();
    expect(component.destinationLocationInput).toBe('');
  });

  it('should clear all locations', () => {
    component.places = [{}];
    component.clearLocation();
    expect(component.places).toEqual([]);
    expect(mockStore.dispatch).toHaveBeenCalled();
    expect(mockOutdoor.clearDestinationPoint).toHaveBeenCalled();
    expect(mockOutdoor.clearNavigation).toHaveBeenCalled();
    expect(mockOutdoor.setSelectedStrategy).toHaveBeenCalledWith(null);
    expect(mockMappedin.clearNavigation).toHaveBeenCalled();
    expect(mockIndoor.clearDestinationPoint).toHaveBeenCalled();
  });

  it('should handle ngOnInit indoor points', fakeAsync(() => {
    mockOutdoor.getStartPoint$.and.returnValue(of(null));
    mockOutdoor.getDestinationPoint$.and.returnValue(of(null));
    mockIndoor.getStartPoint$.and.returnValue(of({}));
    mockIndoor.getDestinationPoint$.and.returnValue(of({}));
    component.ngOnInit();
    tick();
    expect(component.disableStart).toBe(false);
  }));

  it('should handle ngOnInit outdoor points with route strategy', fakeAsync(() => {
    mockOutdoor.getStartPoint$.and.returnValue(of({}));
    mockOutdoor.getDestinationPoint$.and.returnValue(of({}));
    mockIndoor.getStartPoint$.and.returnValue(of(null));
    mockIndoor.getDestinationPoint$.and.returnValue(of(null));
    mockOutdoor.getShortestRoute.and.returnValue(Promise.resolve('strategy'));

    component.ngOnInit();
    tick();
    expect(mockOutdoor.setSelectedStrategy).toHaveBeenCalledWith('strategy');
    expect(mockOutdoor.renderNavigation).toHaveBeenCalled();
    expect(component.disableStart).toBe(false);
  }));

  it('should throw if location is null', async () => {
    mockLocation.getCurrentLocation.and.returnValue(Promise.resolve(null));
    await expectAsync(component.onSetUsersLocationAsStart()).toBeRejectedWithError('Current location is null.');
  });

  it('should set user location as start', async () => {
    const coords = { lat: 1, lng: 2 };
    mockLocation.getCurrentLocation.and.returnValue(Promise.resolve(coords));
    await component.onSetUsersLocationAsStart();
    expect(mockOutdoor.setStartPoint).toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  it('should search places', async () => {
    mockPlaces.getPlaceSuggestions.and.returnValue(Promise.resolve(['place1']));
    await component.onSearchChange({ target: { value: 'query' } }, 'start');
    expect(component.places).toEqual(['place1']);
    expect(component.isSearchingFromStart).toBeTrue();
  });

  it('should clear places if search is empty', async () => {
    component.places = ['existing'];
    await component.onSearchChange({ target: { value: '  ' } }, 'destination');
    expect(component.places.length).toBe(0);
  });

  it('should dispatch showRoute and hide search', async () => {
    component.isSearchVisible = true;
    await component.onStartClick();
    expect(mockStore.dispatch).toHaveBeenCalled();
    expect(component.isSearchVisible).toBe(false);
  });

  it('should set indoor start point', async () => {
    const place = { title: 'title', type: 'indoor', fullName: 'full', address: 'addr', indoorMapId: '1' };
    mockMappedin.getMapId.and.returnValue('2');
    mockMappedin.setMapData.and.returnValue(Promise.resolve());

    await component.setStart(place);
    expect(mockIndoor.setStartPoint).toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalled();
    expect(mockMappedin.setMapData).toHaveBeenCalledWith('1');
  });

  it('should set outdoor start point', async () => {
    const place = { title: 'title', type: 'outdoor' };
    await component.setStart(place);
    expect(mockOutdoor.setStartPoint).toHaveBeenCalledWith(place);
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  it('should set indoor destination point', async () => {
    const place = { title: 'title', type: 'indoor', fullName: 'full', address: 'addr', indoorMapId: '1' };
    mockMappedin.getMapId.and.returnValue('2');
    mockMappedin.setMapData.and.returnValue(Promise.resolve());

    await component.setDestination(place);
    expect(mockIndoor.setDestinationPoint).toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  it('should set outdoor destination point', async () => {
    const place = { title: 'title', type: 'outdoor' };
    await component.setDestination(place);
    expect(mockOutdoor.setDestinationPoint).toHaveBeenCalledWith(place);
    expect(mockStore.dispatch).toHaveBeenCalled();
  });
});
