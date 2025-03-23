import { Location } from './location.interface';

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
