import { TestBed } from '@angular/core/testing';
import { IndoorRoutingStrategy } from './indoor-routing.strategy';
import { IndoorDirectionsService } from '../services/indoor-directions/indoor-directions.service';
import { MappedinService } from '../services/mappedin/mappedin.service';
import { of } from 'rxjs';
import { MappedInLocation } from '../interfaces/mappedin-location.interface';

describe('IndoorRoutingStrategy', () => {
  let strategy: IndoorRoutingStrategy;
  let mockIndoorDirectionsService: any;
  let mockMappedinService: any;

  beforeEach(() => {
    mockIndoorDirectionsService = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve())
    };

    mockMappedinService = {
      getMapId: jasmine.createSpy('getMapId').and.returnValue('existingMap'),
      setMapData: jasmine.createSpy('setMapData').and.returnValue(Promise.resolve())
    };

    TestBed.configureTestingModule({
      providers: [
        IndoorRoutingStrategy,
        { provide: IndoorDirectionsService, useValue: mockIndoorDirectionsService },
        { provide: MappedinService, useValue: mockMappedinService }
      ]
    });
    strategy = TestBed.inject(IndoorRoutingStrategy);
  });

  it('should call setMapData if indoorMapId differs', async () => {
    const start: MappedInLocation = {
      type: 'indoor',
      indoorMapId: 'newMap',
      room: 'A101',
      title: 'A101 Room',
      address: 'Room Address'
    };
    const destination: MappedInLocation = {
      type: 'indoor',
      indoorMapId: 'newMap',
      room: 'B202',
      title: 'B202 Room',
      address: 'Room Address'
    };

    await strategy.getRoute(start, destination, 'WALKING');
    expect(mockMappedinService.getMapId).toHaveBeenCalled();
    expect(mockMappedinService.setMapData).toHaveBeenCalledWith('newMap');
    expect(mockIndoorDirectionsService.navigate).toHaveBeenCalledWith(start.room, destination.room);
  });

  it('should return a route with type "indoor" and empty instructions', async () => {
    // When indoorMapId is the same, setMapData is not called.
    const start: MappedInLocation = {
      type: 'indoor',
      indoorMapId: 'existingMap',
      room: 'A101',
      title: 'A101 Room',
      address: 'Room Address'
    };
    const destination: MappedInLocation = {
      type: 'indoor',
      indoorMapId: 'existingMap',
      room: 'B202',
      title: 'B202 Room',
      address: 'Room Address'
    };

    const route = await strategy.getRoute(start, destination, 'WALKING');
    expect(route).toEqual({ type: 'indoor', instructions: {} });
  });
});
