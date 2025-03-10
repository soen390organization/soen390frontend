import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CalendarService } from 'src/app/services/calendar/calendar.service';

@Component({
  selector: 'app-google-signin',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './google-signin.component.html',
  styleUrls: ['./google-signin.component.scss'],
})

export class GoogleSignInComponent implements OnInit {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
  enableStart$!: Observable<boolean>;
  calendars: any[] = [];
  selectedCalendar: any;

  constructor(
   private readonly calendarService: CalendarService
  ) {}

  ngOnInit(): void {
    this.calendarService.calendars$.subscribe((calendars) => {
      this.calendars = calendars;
    });

    this.calendarService.selectedCalendar$.subscribe((selectedCalendar) => {
      this.selectedCalendar = selectedCalendar;
    });
  }
}
