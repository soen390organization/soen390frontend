import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventCardComponent } from './event-card.component';
import { OutdoorDirectionsService } from 'src/app/services/outdoor-directions/outdoor-directions.service';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

class MockDirectionsService {
  setDestinationPoint = jasmine.createSpy('setDestinationPoint');
}

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;
  let outdoorDirectionsService: OutdoorDirectionsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
      providers: [{ provide: OutdoorDirectionsService, useClass: MockDirectionsService }]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    outdoorDirectionsService = TestBed.inject(OutdoorDirectionsService);
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
    it('should call directionsService.setDestinationPoint', () => {
      const mockLocation: GoogleMapLocation = {
        title: 'Some Place',
        address: '123 Street',
        coordinates: new google.maps.LatLng(45.5017, -73.5673),
        type: 'outdoor'
      };
      component.setDestination(mockLocation);
      expect(outdoorDirectionsService.setDestinationPoint).toHaveBeenCalledWith(mockLocation);
    });
  });
});
