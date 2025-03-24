import { TestBed } from '@angular/core/testing';
import { IndoorDirectionsService } from './indoor-directions.service';
import { MappedinService } from '../mappedin/mappedin.service';
import { MapData, MapView } from '@mappedin/mappedin-js';
import { of, firstValueFrom } from 'rxjs';

describe('IndoorDirectionsService', () => {
  let service: IndoorDirectionsService;
  let mappedinServiceSpy: jasmine.SpyObj<MappedinService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MappedinService', ['getMapData'], {
      mapView: { Navigation: { draw: jasmine.createSpy('draw') } }
    });

    TestBed.configureTestingModule({
      providers: [IndoorDirectionsService, { provide: MappedinService, useValue: spy }]
    });

    service = TestBed.inject(IndoorDirectionsService);
    mappedinServiceSpy = TestBed.inject(MappedinService) as jasmine.SpyObj<MappedinService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set start room', async () => {
    const mockRoom = { id: 1, title: 'Room A' };
    service.setStartPoint(mockRoom);
    const emitted = await firstValueFrom(service.getStartPoint());
    expect(emitted).toEqual(mockRoom);
  });

  it('should set destination room', async () => {
    const mockRoom = { id: 1, title: 'Room B' };
    service.setDestinationPoint(mockRoom);
    const emitted = await firstValueFrom(service.getDestinationPoint());
    expect(emitted).toEqual(mockRoom);
  });

  it('should retrieve start entrances', async () => {
    spyOn(service, 'getStartPointEntrances').and.returnValue(
      Promise.resolve([{ name: 'Door' }]) as any
    );
    const entrances = await service.getStartPointEntrances();
    expect(entrances.length).toBeGreaterThan(0);
  });

  it('should retrieve destination entrances', async () => {
    spyOn(service, 'getDestinationPointEntrances').and.returnValue(
      Promise.resolve([{ name: 'Door' }]) as any
    );
    const entrances = await service.getDestinationPointEntrances();
    expect(entrances.length).toBeGreaterThan(0);
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

    await service.navigate(mockRoomA, mockRoomB);

    expect(mockMapData.getDirections).toHaveBeenCalledWith(
      jasmine.objectContaining(mockRoomA),
      jasmine.objectContaining(mockRoomB)
    );

    expect(mappedinServiceSpy.mapView.Navigation.draw).toHaveBeenCalledWith(mockDirections);
  });

  it('should not navigate if start or destination room is missing', async () => {
    const mockMapData = {} as unknown as MapData;
    mappedinServiceSpy.getMapData.and.returnValue(of(mockMapData));
    spyOn(console, 'error');
    await service.navigate(null, null);
    expect(console.error).toHaveBeenCalledWith('Missing mapData/start/destination', {
      mapData: mockMapData,
      startRoom: null,
      destinationRoom: null
    });
  });

  it('should log error if directions cannot be generated', async () => {
    const mockMapData = {
      getDirections: jasmine.createSpy('getDirections').and.returnValue(null)
    } as unknown as MapData;

    mappedinServiceSpy.getMapData.and.returnValue(of(mockMapData));

    const mockRoomA = 'Room A';
    const mockRoomB = 'Room B';

    service.setStartPoint({ room: mockRoomA });
    service.setDestinationPoint({ room: mockRoomB });

    spyOn(console, 'error');
    await service.navigate(mockRoomA, mockRoomB);
    expect(console.error).toHaveBeenCalledWith('Unable to generate directions between rooms', {
      startRoom: mockRoomA,
      destinationRoom: mockRoomB
    });
  });
});
