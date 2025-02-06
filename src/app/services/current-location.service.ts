import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root',
})
export class CurrentLocationService {

  constructor() {}

  /**
   * Get the user's current location once.
   * @returns Promise<{ lat: number, lng: number }>
   */
  async getCurrentLocation(): Promise<{ lat: number, lng: number } | null> {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Watch the user's location continuously.
   * @param callback Function to execute on location change.
   * @returns Watch ID (to stop watching later).
   */
  watchLocation(callback: (position: { lat: number, lng: number }) => void): Promise<string> {
    const watchId = Geolocation.watchPosition({}, (position, err) => {
      if (err) {
        console.error('Error watching location:', err);
        return;
      }
      if (position) {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      }
    });

    return watchId;
  }

  /**
   * Stop watching the user's location.
   * @param watchId The ID of the watcher to clear.
   */
  clearWatch(watchId: string): void {
    Geolocation.clearWatch({ id: watchId });
  }
}

