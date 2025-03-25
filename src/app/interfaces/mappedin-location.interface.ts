import { Location } from 'src/app/interfaces/location.interface';

export interface MappedInLocation extends Location {
  indoorMapId: string;
  room: any;
}
