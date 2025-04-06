import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventCardComponent } from './event-card.component';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { Store } from '@ngrx/store';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;
  let navigationCoordinator: NavigationCoordinatorService;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch']);
    const currentLocationSpy = jasmine.createSpyObj('CurrentLocationService', ['getCurrentLocation']);
    const outdoorDirectionsSpy = jasmine.createSpyObj('OutdoorDirectionsService', ['setStartPoint', 'setDestinationPoint']);
    const indoorDirectionsSpy = jasmine.createSpyObj('IndoorDirectionsService', ['setDestinationPoint']);
    const mappedInSpy = jasmine.createSpyObj('MappedinService', ['getMapId', 'setMapData']);

    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
      providers: [
        { provide: Store, useValue: storeSpy },
        { provide: CurrentLocationService, useValue: currentLocationSpy },
        { provide: OutdoorDirectionsService, useValue: outdoorDirectionsSpy },
        { provide: IndoorDirectionsService, useValue: indoorDirectionsSpy },
        { provide: MappedinService, useValue: mappedInSpy },
        { provide: NavigationCoordinatorService, useValue: jasmine.createSpyObj('NavigationCoordinatorService', ['getCompleteRoute']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    navigationCoordinator = TestBed.inject(NavigationCoordinatorService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.events).toEqual([]);
    expect(component.loading).toBeFalse();
  });

  describe('onImageError()', () => {
    it('should set fallback image and remove onerror to prevent loops', () => {
      const mockImg = document.createElement('img');
      component.onImageError({ target: mockImg } as unknown as Event);

      expect(mockImg.src).toContain('assets/images/poi_fail.png');
      expect(mockImg.onerror).toBeNull();
    });
  });

  describe('formatEventTime()', () => {
    it('should format valid times correctly', () => {
      // Example dates
      const start = '2023-08-01T10:00:00';
      const end = '2023-08-01T12:30:00';

      const formatted = component.formatEventTime(start, end);
      // Example output: "Tu, 10:00 - 12:30"
      expect(formatted).toContain('Tu,');
      expect(formatted).toContain('10:00');
      expect(formatted).toContain('12:30');
    });

    it('should return "Invalid time" if input is invalid', () => {
      const formatted = component.formatEventTime('not a date', 'still not a date');
      expect(formatted).toBe('Invalid time');
    });
  });

  describe('setDestination', () => {
    let currentLocationSpy: jasmine.SpyObj<CurrentLocationService>;
    let outdoorDirectionsSpy: jasmine.SpyObj<OutdoorDirectionsService>;
    let indoorDirectionsSpy: jasmine.SpyObj<IndoorDirectionsService>;
    let mappedInSpy: jasmine.SpyObj<MappedinService>;
    let storeSpy: jasmine.SpyObj<Store>;

    beforeEach(() => {
      currentLocationSpy = TestBed.inject(CurrentLocationService) as jasmine.SpyObj<CurrentLocationService>;
      outdoorDirectionsSpy = TestBed.inject(OutdoorDirectionsService) as jasmine.SpyObj<OutdoorDirectionsService>;
      indoorDirectionsSpy = TestBed.inject(IndoorDirectionsService) as jasmine.SpyObj<IndoorDirectionsService>;
      mappedInSpy = TestBed.inject(MappedinService) as jasmine.SpyObj<MappedinService>;
      storeSpy = TestBed.inject(Store) as jasmine.SpyObj<Store>;
      
      // Setup default spy behavior
      currentLocationSpy.getCurrentLocation.and.resolveTo({ lat: 45, lng: -73 });
      mappedInSpy.getMapId.and.returnValue('mapId1');
      spyOn(console, 'log'); // Suppress console logs
    });

    it('should set outdoor destination when no indoor location is provided', async () => {
      const location: any = {
        title: 'Test Location',
        address: '123 Test St',
        coordinates: new google.maps.LatLng(45, -73),
        type: 'outdoor'
      };

      await component.setDestination(location);
      
      expect(currentLocationSpy.getCurrentLocation).toHaveBeenCalled();
      expect(outdoorDirectionsSpy.setStartPoint).toHaveBeenCalled();
      expect(outdoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalled();
    });

    it('should set both indoor and outdoor destinations when indoor location is provided', async () => {
      const outdoorLocation: any = {
        title: 'Test Location',
        address: '123 Test St',
        coordinates: new google.maps.LatLng(45, -73),
        type: 'outdoor'
      };
      
      const indoorLocation: any = {
        title: 'Indoor Location',
        address: '123 Test St',
        indoorMapId: 'mapId1',
        room: { id: 'room1', name: 'Room 1' },
        type: 'indoor'
      };

      await component.setDestination(outdoorLocation, indoorLocation);
      
      expect(indoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
      expect(outdoorDirectionsSpy.setDestinationPoint).toHaveBeenCalled();
      expect(storeSpy.dispatch).toHaveBeenCalled();
    });

    it('should change the map data if the indoor location has a different map ID', async () => {
      const outdoorLocation: any = {
        title: 'Test Location',
        address: '123 Test St',
        coordinates: new google.maps.LatLng(45, -73),
        type: 'outdoor'
      };
      
      const indoorLocation: any = {
        title: 'Indoor Location',
        address: '123 Test St',
        indoorMapId: 'differentMapId',
        room: { id: 'room1', name: 'Room 1' },
        type: 'indoor'
      };

      await component.setDestination(outdoorLocation, indoorLocation);
      
      expect(mappedInSpy.setMapData).toHaveBeenCalledWith('differentMapId');
    });
  });
});
