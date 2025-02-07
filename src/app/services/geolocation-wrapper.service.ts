import { Geolocation } from '@capacitor/geolocation';

// Re-export the Geolocation plugin under your own variable or name
export const Geo = {
  getCurrentPosition: Geolocation.getCurrentPosition,
  watchPosition: Geolocation.watchPosition,
  clearWatch: Geolocation.clearWatch,
};
