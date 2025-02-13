export interface Step {
  instruction: string;
  location: google.maps.LatLng;
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
}
