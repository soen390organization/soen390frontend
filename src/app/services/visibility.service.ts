import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class VisibilityService {
  private showDirections$ = new BehaviorSubject<boolean>(false);
  private showPOIs$ = new BehaviorSubject<boolean>(true);

  constructor() {}

  // Show Component 1 and hide Component 2
  showDirectionsComponent(): void {
    console.log("Before", this.showDirections$.getValue())
    this.showDirections$.next(true);  // Show Component 1
    console.log("After", this.showDirections$.getValue())
  }

  hidePOIsComponent(): void {
    this.showPOIs$.next(false); // Hide Component 2
  }

  // Observables for other components to subscribe
  get showDirections() {
    return this.showDirections$.asObservable();
  }

  get showPOIs() {
    return this.showPOIs$.asObservable();
  }
}
