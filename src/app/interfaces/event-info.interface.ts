import { Location } from "src/app/interfaces/location.interface";
import { EventType } from "src/app/enums/event-type.enum";

export interface EventInfo {
  title: string;
  type: EventType;
  dateTime: Date;
  location: Location;
}