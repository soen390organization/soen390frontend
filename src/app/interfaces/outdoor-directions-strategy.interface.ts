import { Location } from './location.interface';

export interface OutdoorDirectionsStrategy<T extends Location> {
  getRoutes(origin: T, destination: T): Promise<any>;
}