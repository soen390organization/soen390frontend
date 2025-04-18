import { TestBed } from '@angular/core/testing';
import { CurrentLocationService } from './current-location.service';

// Import the wrapper, *not* the Capacitor plugin directly
import { Geo } from '../geolocation/geolocation-wrapper.service';

describe('CurrentLocationService', () => {
  let service: CurrentLocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrentLocationService]
    });
    service = TestBed.inject(CurrentLocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#getCurrentLocation', () => {
    it('should return lat/lng when successful', async () => {
      // Spy on our wrapper's getCurrentPosition
      spyOn(Geo, 'getCurrentPosition').and.returnValue(
        Promise.resolve({
          coords: { latitude: 10, longitude: 20 }
        } as GeolocationPosition)
      );

      const result = await service.getCurrentLocation();
      expect(result).toEqual({ lat: 10, lng: 20 });
    });

    it('should return null if an error occurs and useFallback is false', async () => {
      spyOn(Geo, 'getCurrentPosition').and.returnValue(Promise.reject('some error'));
      const consoleSpy = spyOn(console, 'error');

      const result = await service.getCurrentLocation(false); // Pass false to disable fallback
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error getting location:', 'some error');
    });
  });

  describe('#watchLocation', () => {
    it('should call the callback when position updates', async () => {
      // We simulate watchPosition calling the callback with a position
      spyOn(Geo, 'watchPosition').and.callFake((_, callback) => {
        callback({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition, null);
        return Promise.resolve('mock-watch-id');
      });

      const callbackFn = jasmine.createSpy('callback');
      const watchId = await service.watchLocation(callbackFn);

      expect(watchId).toBe('mock-watch-id');
      expect(callbackFn).toHaveBeenCalledWith({ lat: 1, lng: 2 });
    });

    it('should log an error if watchPosition gets an error', async () => {
      const consoleSpy = spyOn(console, 'error');
      spyOn(Geo, 'watchPosition').and.callFake((_, callback) => {
        callback(null, new Error('watch error'));
        return Promise.resolve('mock-watch-id');
      });

      const callbackFn = jasmine.createSpy('callback');
      const watchId = await service.watchLocation(callbackFn);

      expect(watchId).toBe('mock-watch-id');
      expect(consoleSpy).toHaveBeenCalledWith('Error watching location:', new Error('watch error'));
      // callback should not be called if there's an error
      expect(callbackFn).not.toHaveBeenCalled();
    });
  });

  describe('#clearWatch', () => {
    it('should call Geo.clearWatch with the given ID', () => {
      const clearWatchSpy = spyOn(Geo, 'clearWatch');
      service.clearWatch('my-test-id');
      expect(clearWatchSpy).toHaveBeenCalledWith({ id: 'my-test-id' });
    });
  });
});
