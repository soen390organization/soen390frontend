export interface Step {
    instructions: string;
    start_location: google.maps.LatLng;
    distance?: {
      text: string;
      value: number;
    };
    duration?: {
      text: string;
      value: number;
    };
    transit_details?: google.maps.TransitDetails
}
