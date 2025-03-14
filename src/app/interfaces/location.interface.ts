export interface Location {
  title?: string;
  name?: string;
  address: string;
  coordinates: google.maps.LatLng;
  image?: string;
  marker?: google.maps.Marker;
}
