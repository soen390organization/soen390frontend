import { Location } from 'src/app/interfaces/location.interface';

export interface GoogleMapLocation extends Location {
  coordinates: google.maps.LatLng;
  marker?: google.maps.Marker;
}
