import { Injectable } from '@angular/core';
import { Geo } from '../geolocation/geolocation-wrapper.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CurrentLocationService {
  // Cache the last known position to avoid permission requests on every click
  private lastKnownPosition = new BehaviorSubject<{ lat: number; lng: number } | null>(null);
  
  // Flag to determine if we're already trying to get the position
  private isGettingPosition = false;
  
  // Default campus location (SGW) as fallback
  private readonly DEFAULT_LOCATION = { lat: 45.497304, lng: -73.578326 };

  constructor() {
    // Try to get the user's location when the service is initialized
    this.refreshCurrentLocation();
  }

  /**
   * Get the user's current location once.
   * First tries to return the cached location if available.
   * If not, requests a new location.
   * Includes a fallback to a default location if the user denies permission.
   * 
   * @param useFallback Whether to return a default location if unable to get user's location
   * @returns Promise<{ lat: number, lng: number }>
   */
  async getCurrentLocation(useFallback = true): Promise<{ lat: number; lng: number } | null> {
    // If we already have a cached position, return it
    if (this.lastKnownPosition.value) {
      return this.lastKnownPosition.value;
    }
    
    // If we're already trying to get the position, wait to avoid multiple requests
    if (this.isGettingPosition) {
      // Wait for 2 seconds to see if the position becomes available
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (this.lastKnownPosition.value) {
        return this.lastKnownPosition.value;
      }
    }
    
    // Try to get a fresh position
    try {
      this.isGettingPosition = true;
      const coordinates = await Geo.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000 // 5 second timeout
      });
      
      const position = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };
      
      // Store the position for future use
      this.lastKnownPosition.next(position);
      this.isGettingPosition = false;
      
      return position;
    } catch (error) {
      console.error('Error getting location:', error);
      this.isGettingPosition = false;
      
      // Return default location if fallback is enabled and we have no cached position
      if (useFallback) {
        console.warn('Using default location (SGW campus) as fallback');
        return this.DEFAULT_LOCATION;
      }
      
      return null;
    }
  }
  
  /**
   * Force a refresh of the user's current location
   */
  async refreshCurrentLocation(): Promise<void> {
    try {
      this.isGettingPosition = true;
      const coordinates = await Geo.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000
      });
      
      const position = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };
      
      // Update the cached position
      this.lastKnownPosition.next(position);
      this.isGettingPosition = false;
    } catch (error) {
      console.error('Error refreshing location:', error);
      this.isGettingPosition = false;
    }
  }

  /**
   * Watch the user's location continuously.
   * @param callback Function to execute on location change.
   * @returns Watch ID (to stop watching later).
   */
  watchLocation(callback: (position: { lat: number; lng: number }) => void): Promise<string> {
    const watchId = Geo.watchPosition({ enableHighAccuracy: true }, (position, err) => {
      if (err) {
        console.error('Error watching location:', err);
        return;
      }
      if (position) {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Update the cached position as well
        this.lastKnownPosition.next(newPosition);
        
        callback(newPosition);
      }
    });

    return watchId;
  }

  /**
   * Stop watching the user's location.
   * @param watchId The ID of the watcher to clear.
   */
  clearWatch(watchId: string): void {
    Geo.clearWatch({ id: watchId });
  }
}
