import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisibilityService {
  private showDirections$ = new BehaviorSubject<boolean>(false);
  private showPOIs$ = new BehaviorSubject<boolean>(true);
  private enableStart$ = new BehaviorSubject<boolean>(true);
  private endNavigation$ = new Subject<void>();

  constructor() {}

  // Toggle visibility of Directions component
  toggleDirectionsComponent(): void {
    this.showDirections$.next(!this.showDirections$.getValue()); // Toggle Component 1
  }

  // Toggle visibility of points of interest and buildings component
  togglePOIsComponent(): void {
    this.showPOIs$.next(!this.showPOIs$.getValue()); // Toggle Component 2
  }

  toggleStartButton(): void {
    this.enableStart$.next(!this.enableStart$.getValue());
    console.log('Switched enable start');
  }

  triggerEndNavigation(): void {
    this.endNavigation$.next();
  }

  // Observables for other components to subscribe
  get showDirections() {
    return this.showDirections$.asObservable();
  }

  get showPOIs() {
    return this.showPOIs$.asObservable();
  }

  get enableStart() {
    return this.enableStart$.asObservable();
  }

  get endNavigation() {
    return this.endNavigation$.asObservable();
  }
}
