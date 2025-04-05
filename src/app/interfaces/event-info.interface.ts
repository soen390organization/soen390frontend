import { EventType } from 'src/app/enums/event-type.enum';
import { GoogleMapLocation } from './google-map-location.interface';
import { MappedInLocation } from './mappedin-location.interface';

export interface EventInfo {
  title: string;
  type: EventType;
  startTime: string;
  endTime: string;
  googleLoc: GoogleMapLocation;
  mappedInLoc?: MappedInLocation;
  timeToNext?: string;
}
