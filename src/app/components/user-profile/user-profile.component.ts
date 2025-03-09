import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { HomePage } from 'src/app/home/home.page';
import { VisibilityService } from 'src/app/services/visibility.service';
import { combineLatest, Observable } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  animations: [
    trigger('slideInOut', [
      state(
        'in',
        style({
          width: '360px',
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      state(
        'out',
        style({
          width: '0px',
          opacity: 0,
          transform: 'translateX(-100%)',
        })
      ),
      transition('out => in', animate('0.15s ease-in-out')),
      transition('in => out', animate('0.15s ease-in-out')),
    ]),
  ],
})

export class UserProfileComponent implements OnInit {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
  isCalendarSelected = false; //Flag to determine if a calendar has been selected.
  isSearchVisible = false;
  calendars: any[] = []; // Array to store the calendars of the user
  selectedCalendar: any = null; // Currently selected calendar
  calendarClasses: any[] = []; //Array to store all classes in a user's selected valid calendar.
  enableStart$!: Observable<boolean>;

  constructor(
    private visibilityService: VisibilityService
  ) {}

  ngOnInit(): void {
    this.enableStart$ = this.visibilityService.enableStart;
    if (this.selectedCalendar = null) {
      if (this.calendars.length > 0) {
        this.selectedCalendar = this.calendars[0];
      }
    }
  }
}
