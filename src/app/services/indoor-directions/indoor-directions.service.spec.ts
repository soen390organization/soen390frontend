import { TestBed } from '@angular/core/testing';
import { IndoorDirectionsService } from './indoor-directions.service';
import { MappedinService } from '../mappedin/mappedin.service';
import { of } from 'rxjs';
import { MapData, MapView } from '@mappedin/mappedin-js';

describe('IndoorDirectionsService', () => {
  let service: IndoorDirectionsService;
  let mappedinServiceSpy: jasmine.SpyObj<MappedinService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MappedinService', ['getMapData'], { mapView: { Navigation: { draw: jasmine.createSpy('draw') } } });

    TestBed.configureTestingModule({
      providers: [
        IndoorDirectionsService,
        { provide: MappedinService, useValue: spy },
      ],
    });

    service = TestBed.inject(IndoorDirectionsService);
    mappedinServiceSpy = TestBed.inject(MappedinService) as jasmine.SpyObj<MappedinService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set start room', () => {
    const mockRoom = { id: 1, title: 'Room A' };
    service.setStartPoint(mockRoom);
    expect(service.getStartPoint()).toEqual(mockRoom);
  });

  it('should set destination room', () => {
    const mockRoom = { id: 2, title: 'Room B' };
    spyOn(service, 'navigate'); // Mock navigate function
    service.setDestinationPoint(mockRoom);
    expect(service.getDestinationPoint()).toEqual(mockRoom);
    expect(service.navigate).toHaveBeenCalled();
  });

  it('should retrieve entrances', async () => {
    const mockMapData = {
        getByType: jasmine.createSpy('getByType').and.returnValue([{ name: 'Door' }])
      } as unknown as MapData;
      
      mappedinServiceSpy.getMapData.and.returnValue(of(mockMapData));
      
      const entrances = await service.getEntrances();
      expect(entrances.length).toBeGreaterThan(0);
      expect(mockMapData.getByType).toHaveBeenCalledWith('door' as any);
      
  });

  it('should call getDirections with correct parameters', async () => {
    const mockDirections = {} as any;
  
    const mockMapData = {
      getDirections: jasmine.createSpy('getDirections').and.returnValue(mockDirections)
    } as unknown as MapData;
  
    mappedinServiceSpy.getMapData.and.returnValue(of(mockMapData));
  
    const mockRoomA = { id: 1, title: 'Room A' };
    const mockRoomB = { id: 2, title: 'Room B' };
  
    service.setStartPoint({ room: mockRoomA });
    service.setDestinationPoint({ room: mockRoomB });
  
    await service.navigate();
  
    expect(mockMapData.getDirections).toHaveBeenCalledWith(
      jasmine.objectContaining(mockRoomA),
      jasmine.objectContaining(mockRoomB)
    );
  
    expect(mappedinServiceSpy.mapView.Navigation.draw).toHaveBeenCalledWith(mockDirections);
  });
  
  
  it('should not navigate if start or destination room is missing', async () => {
    spyOn(console, 'error');
    await service.navigate();
    expect(console.error).toHaveBeenCalledWith('Start room or destination room not found in map data.');
  });

  it('should log error if directions cannot be generated', async () => {
    const mockMapData = {
      getDirections: jasmine.createSpy('getDirections').and.returnValue(null)
    } as unknown as MapData;

    mappedinServiceSpy.getMapData.and.returnValue(of(mockMapData));

    service.setStartPoint({ room: 'Room A' });
    service.setDestinationPoint({ room: 'Room B' });

    spyOn(console, 'error');
    await service.navigate();
    expect(console.error).toHaveBeenCalledWith('Unable to generate directions between rooms.');
  });
});
