
/* temporary Location interface, going to go in the interface file after US #20-21 */
/* @TODO: we would like to have subtypes of this: IndoorLocation and OutdoorLocation */
export interface Location {
    type: 'indoor' | 'outdoor';
    // For outdoor routing, we require an address (or coordinates)
    address?: string;
    coordinates?: google.maps.LatLng;
    // Future extension: for indoor routing, you might include building/room IDs.
    buildingId?: string;
    roomId?: string;
  }
  
  export interface RouteSegment {
    type: 'indoor' | 'outdoor';
    instructions: any; 
  }
  
  export interface CompleteRoute {
    segments: RouteSegment[];
  }
  
  export interface RoutingStrategy {
    getRoute(start: Location, destination: Location, mode: string): Promise<RouteSegment>;
  }
  