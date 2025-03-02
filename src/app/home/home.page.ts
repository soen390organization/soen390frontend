import { Component, EventEmitter } from '@angular/core';

var isSearchVisible_Global = false;
var searchStateChange = new EventEmitter<boolean>();

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage {
  isSearchVisible = false;


  constructor() {
    searchStateChange.subscribe((state: boolean) => {
      this.isSearchVisible = state;
      isSearchVisible_Global = state;
      console.log(state);
    });
  }

  showSearch() {
    searchStateChange.emit(true);
  }

  hideSearch() {
    searchStateChange.emit(false);
  }
}


