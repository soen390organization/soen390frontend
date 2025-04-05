import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventCardComponent } from './event-card.component';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { NavigationCoordinatorService } from 'src/app/services/navigation-coordinator.service';
import { provideMockStore } from '@ngrx/store/testing';
import { IndoorDirectionsService } from 'src/app/services/indoor-directions/indoor-directions.service';
import { CurrentLocationService } from 'src/app/services/current-location/current-location.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';

class MockNavigationCoordinatorService {
  routeFromCurrentLocationToDestination = jasmine.createSpy('routeFromCurrentLocationToDestination')
    .and.returnValue(Promise.resolve());
}

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;
  let navigationCoordinator: NavigationCoordinatorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
      providers: [
        provideMockStore({}),
        { provide: NavigationCoordinatorService, useClass: MockNavigationCoordinatorService }
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

  describe('setDestination()', () => {
    it('should call navigationCoordinator.routeFromCurrentLocationToDestination', async () => {
      const mockLocation: GoogleMapLocation = {
        title: 'Some Place',
        address: '123 Street',
        coordinates: new google.maps.LatLng(45.5017, -73.5673),
        type: 'outdoor'
      };
      
      await component.setDestination(mockLocation);
      
      expect(navigationCoordinator.routeFromCurrentLocationToDestination)
        .toHaveBeenCalledWith(mockLocation);
    });
    
    it('should handle indoor locations correctly', async () => {
      const mockLocation: GoogleMapLocation = {
        title: 'Some Place',
        address: '123 Street',
        coordinates: new google.maps.LatLng(45.5017, -73.5673),
        type: 'outdoor'
      };
      
      const mockIndoorLocation = {
        title: 'Indoor Place',
        address: 'Indoor Address',
        coordinates: new google.maps.LatLng(45.5, -73.5),
        type: 'indoor',
        indoorMapId: 'map123',
        room: 'H-531'
      };
      
      await component.setDestination(mockLocation, mockIndoorLocation);
      
      expect(navigationCoordinator.routeFromCurrentLocationToDestination)
        .toHaveBeenCalledWith(mockIndoorLocation);
    });
    
    it('should handle errors gracefully', async () => {
      const mockLocation: GoogleMapLocation = {
        title: 'Some Place',
        address: '123 Street',
        coordinates: new google.maps.LatLng(45.5017, -73.5673),
        type: 'outdoor'
      };
      
      // Make the coordinator throw an error
      (navigationCoordinator.routeFromCurrentLocationToDestination as jasmine.Spy)
        .and.throwError('Test error');
      
      // Spy on console.error
      const consoleSpy = spyOn(console, 'error');
      
      // This should not throw
      await component.setDestination(mockLocation);
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
