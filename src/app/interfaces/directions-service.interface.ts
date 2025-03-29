import { BehaviorSubject, Observable } from "rxjs";
import { Location } from "./location.interface";

// TODO - Convert to Abstract Class
export interface DirectionsService {
  startPointSubject$: BehaviorSubject<Location | null>;
  destinationPointSubject$: BehaviorSubject<Location | null>;
  setStartPoint(location: Location): Location;
  getStartPoint(): Observable<Location | null>;
  setDestinationPoint(location: Location): Location;
  getDestinationPoint(): Observable<Location | null>;
  renderNavigation(): void;
}