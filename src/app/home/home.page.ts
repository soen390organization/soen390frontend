import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapType, selectCurrentMap } from 'src/app/store/app';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  currentMap: MapType = MapType.Outdoor;
  mapType = MapType;
  loading: boolean = true;
  googleMapInitialized: boolean = false;
  mappedinMapInitialized: boolean = false;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.select(selectCurrentMap).subscribe(map => {
      this.currentMap = map;
    });
  }

  onGoogleMapInitialized(): void {
    this.googleMapInitialized = true;
    this.checkInitialization();
  }

  onMappedinMapInitialized(): void {
    this.mappedinMapInitialized = true;
    this.checkInitialization();
  }

  private checkInitialization(): void {
    if (this.googleMapInitialized && this.mappedinMapInitialized) {
      this.loading = false;
    }
  }
}
