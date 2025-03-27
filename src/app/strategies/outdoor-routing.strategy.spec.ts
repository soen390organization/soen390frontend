import { TestBed } from '@angular/core/testing';
import { OutdoorRoutingStrategy } from './outdoor-routing.strategy';
import { DirectionsService } from '../services/outdoor-directions/outdoor-directions.service';
import { GoogleMapLocation } from '../interfaces/google-map-location.interface';

describe('OutdoorRoutingStrategy', () => {
  let strategy: OutdoorRoutingStrategy;
  let mockDirectionsService: any;

  beforeEach(() => {
    mockDirectionsService = jasmine.createSpyObj('DirectionsService', ['generateRoute']);
    mockDirectionsService.generateRoute.and.returnValue(Promise.resolve('outdoor instructions'));

    TestBed.configureTestingModule({
      providers: [
        OutdoorRoutingStrategy,
        { provide: DirectionsService, useValue: mockDirectionsService }
      ]
    });
    strategy = TestBed.inject(OutdoorRoutingStrategy);
  });

  it('should throw error if addresses are missing', async () => {
    const start: GoogleMapLocation = {
      title: 'Start',
      address: '',
      coordinates: new google.maps.LatLng(45, -73),
      type: 'outdoor'
    };
    const destination: GoogleMapLocation = {
      title: 'Destination',
      address: '',
      coordinates: new google.maps.LatLng(45, -73),
      type: 'outdoor'
    };

    await expectAsync(strategy.getRoute(start, destination, 'WALKING')).toBeRejectedWithError(
      'Outdoor routing requires addresses for both start and destination.'
    );
  });

  it('should call generateRoute and return a route for valid addresses', async () => {
    const start: GoogleMapLocation = {
      title: 'Start',
      address: '123 Street',
      coordinates: new google.maps.LatLng(45, -73),
      type: 'outdoor'
    };
    const destination: GoogleMapLocation = {
      title: 'Destination',
      address: '456 Avenue',
      coordinates: new google.maps.LatLng(46, -74),
      type: 'outdoor'
    };

    const route = await strategy.getRoute(start, destination, 'WALKING');
    expect(mockDirectionsService.generateRoute).toHaveBeenCalledWith(
      '123 Street',
      '456 Avenue',
      'WALKING'
    );
    expect(route).toEqual({ type: 'outdoor', instructions: 'outdoor instructions' });
  });
});
