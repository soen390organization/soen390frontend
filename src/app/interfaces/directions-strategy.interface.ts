import { Location } from './location.interface';

export interface DirectionsStrategy<T extends Location> {
  getRoutes(origin: T, destination: T): Promise<any>;
}