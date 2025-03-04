import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { setMapType, MapType, selectCurrentMap } from 'src/app/store/app';

@Component({
  selector: 'app-switch-map-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch-map-button.component.html',
  styleUrls: ['./switch-map-button.component.scss']
})
export class SwitchMapButtonComponent {
  mapType = MapType;
  currentMap$: Observable<MapType>;

  constructor(private store: Store) {
    this.currentMap$ = this.store.select(selectCurrentMap);
  }

  toggleMap(): void {
    this.currentMap$.pipe(take(1)).subscribe(currentMap => {
      const newMap = currentMap === MapType.Outdoor ? MapType.Indoor : MapType.Outdoor;
      this.store.dispatch(setMapType({ mapType: newMap }));
    });
  }
}
