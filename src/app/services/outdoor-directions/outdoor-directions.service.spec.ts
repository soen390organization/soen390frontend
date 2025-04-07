import { TestBed } from '@angular/core/testing';
import { OutdoorDirectionsService } from './outdoor-directions.service';
import { GoogleMapService } from '../google-map.service';
import {
  OutdoorWalkingStrategy,
  OutdoorDrivingStrategy,
  OutdoorTransitStrategy,
  OutdoorShuttleStrategy
} from 'src/app/strategies/outdoor-directions';
import { AbstractOutdoorStrategy } from 'src/app/strategies/outdoor-directions/abstract-outdoor.strategy';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';

describe('OutdoorDirectionsService', () => {
  let service: OutdoorDirectionsService;
  let googleMapServiceSpy: jasmine.SpyObj<GoogleMapService>;
  let mockStrategy: jasmine.SpyObj<AbstractOutdoorStrategy>;

  const mockMap = {} as google.maps.Map;
  const mockLatLng = {
    lat: () => 10,
    lng: () => 20
  } as google.maps.LatLng;

  const mockStartPoint: GoogleMapLocation = {
    title: 'Start',
    coordinates: mockLatLng,
    address: '',
    type: 'outdoor'
  };

  const mockDestinationPoint: GoogleMapLocation = {
    title: 'End',
    coordinates: {
      lat: () => 30,
      lng: () => 40
    } as google.maps.LatLng,
    address: '',
    type: 'outdoor'
  };

  // ✅ Google Maps mock setup
  beforeAll(() => {
    (globalThis as any).google = {
      maps: {
        Map: class {},
        LatLng: class {},
        marker: {
          AdvancedMarkerElement: class {
            title: string = '';
            position: any;
            map: any = null;
          },
          PinElement: class {}
        }
      }
    };    
  });  

  beforeEach(() => {
    const mapServiceSpy = jasmine.createSpyObj('GoogleMapService', ['getMap']);
    const strategySpy = jasmine.createSpyObj<AbstractOutdoorStrategy>('AbstractOutdoorStrategy', [
      'getRoutes',
      'renderRoutes',
      'clearRenderedRoutes',
      'getTotalDuration'
    ]);

    TestBed.configureTestingModule({
      providers: [
        OutdoorDirectionsService,
        { provide: GoogleMapService, useValue: mapServiceSpy },
        { provide: OutdoorWalkingStrategy, useValue: strategySpy },
        { provide: OutdoorDrivingStrategy, useValue: strategySpy },
        { provide: OutdoorTransitStrategy, useValue: strategySpy },
        { provide: OutdoorShuttleStrategy, useValue: strategySpy }
      ]
    });

    service = TestBed.inject(OutdoorDirectionsService);
    googleMapServiceSpy = TestBed.inject(GoogleMapService) as jasmine.SpyObj<GoogleMapService>;
    mockStrategy = TestBed.inject(OutdoorWalkingStrategy) as unknown as jasmine.SpyObj<AbstractOutdoorStrategy>;

    googleMapServiceSpy.getMap.and.returnValue(mockMap);

    spyOn(service, 'getStartPoint').and.resolveTo(mockStartPoint);
    spyOn(service, 'getDestinationPoint').and.resolveTo(mockDestinationPoint);
  });

  describe('getSelectedStrategy$ and setSelectedStrategy', () => {
    it('should emit selected strategy', async () => {
      service.setSelectedStrategy(mockStrategy);
      const result = await service.getSelectedStrategy();
      expect(result).toBe(mockStrategy);
    });
  });

  // describe('showStartMarker', () => {
  //   it('should create and assign the start marker', async () => {
  //     service.startPointMarker = null!;
  //     await service.showStartMarker();

  //     expect(service.startPointMarker).toBeDefined();
  //     expect(service.startPointMarker.title).toBe('Start');
  //     expect(service.startPointMarker.position).toEqual({ lat: 10, lng: 20 });
  //     expect(service.startPointMarker.map).toBe(mockMap);
  //   });

  //   it('should reuse existing start marker', async () => {
  //     const marker = new google.maps.marker.AdvancedMarkerElement();
  //     service.startPointMarker = marker;
  //     await service.showStartMarker();
  //     expect(service.startPointMarker.title).toBe('Start');
  //   });
  // });

  // describe('clearStartMarker', () => {
  //   it('should clear start marker map', () => {
  //     const marker = new google.maps.marker.AdvancedMarkerElement();
  //     marker.map = {} as google.maps.Map;
  //     service.startPointMarker = marker;
  //     service.clearStartMarker();
  //     expect(marker.map).toBeNull();
  //   });
  // });

  // describe('showDestinationMarker', () => {
  //   it('should create and assign the destination marker', async () => {
  //     service.destinationPointMarker = null!;
  //     await service.showDestinationMarker();

  //     expect(service.destinationPointMarker).toBeDefined();
  //     expect(service.destinationPointMarker.title).toBe('End');
  //     expect(service.destinationPointMarker.position).toEqual({ lat: 30, lng: 40 });
  //     expect(service.destinationPointMarker.map).toBe(mockMap);
  //   });

  //   it('should reuse existing destination marker', async () => {
  //     const marker = new google.maps.marker.AdvancedMarkerElement();
  //     service.destinationPointMarker = marker;
  //     await service.showDestinationMarker();
  //     expect(service.destinationPointMarker.title).toBe('End');
  //   });
  // });

  // describe('clearDestinationMarker', () => {
  //   it('should clear destination marker map', () => {
  //     const marker = new google.maps.marker.AdvancedMarkerElement();
  //     marker.map = {} as google.maps.Map;
  //     service.destinationPointMarker = marker;
  //     service.clearDestinationMarker();
  //     expect(marker.map).toBeNull();
  //   });
  // });

  describe('getShortestRoute', () => {
    it('should return strategy with shortest duration', async () => {
      const strategy1 = jasmine.createSpyObj<AbstractOutdoorStrategy>('Strategy1', ['getTotalDuration', 'getRoutes']);
      const strategy2 = jasmine.createSpyObj<AbstractOutdoorStrategy>('Strategy2', ['getTotalDuration', 'getRoutes']);

      strategy1.getTotalDuration.and.returnValue({ value: 50, text: '50 mins' });
      strategy2.getTotalDuration.and.returnValue({ value: 30, text: '30 mins' });

      strategy1.getRoutes.and.resolveTo(strategy1);
      strategy2.getRoutes.and.resolveTo(strategy2);

      (service as any).outdoorWalkingStrategy = strategy1;
      (service as any).outdoorDrivingStrategy = strategy2;
      (service as any).outdoorTransitStrategy = strategy1;
      (service as any).outdoorShuttleStrategy = strategy2;

      const result = await service.getShortestRoute();
      expect(result).toBe(strategy2);
    });
  });

  describe('renderNavigation', () => {
    it('should call renderRoutes on selected strategy', async () => {
      service.setSelectedStrategy(mockStrategy);
      await service.renderNavigation();
      expect(mockStrategy.renderRoutes).toHaveBeenCalled();
    });
  });

  describe('clearNavigation', () => {
    it('should call clearRenderedRoutes on selected strategy', async () => {
      service.setSelectedStrategy(mockStrategy);
      await service.clearNavigation();
      expect(mockStrategy.clearRenderedRoutes).toHaveBeenCalled();
    });
  });
});
