import { Component, OnInit, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapType, selectCurrentMap } from 'src/app/store/app';

let isSearchVisible_Global = false;
let searchStateChange = new EventEmitter<boolean>();

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  // Map-related properties
  currentMap: MapType = MapType.Outdoor;
  mapType = MapType;
  loading: boolean = true;
  googleMapInitialized: boolean = false;
  mappedinMapInitialized: boolean = false;

  // Search-related property
  isSearchVisible = false;

  constructor(private readonly store: Store) {
    // Subscribe to search state changes
    searchStateChange.subscribe((state: boolean) => {
      this.isSearchVisible = state;
      isSearchVisible_Global = state;
      console.log('Search state changed:', state);
    });
  }

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

  showSearch(): void {
    searchStateChange.emit(true);
  }

  hideSearch(): void {
    searchStateChange.emit(false);
  }
}
