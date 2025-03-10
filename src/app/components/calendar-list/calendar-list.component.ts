import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-calendar-list',
  templateUrl: './calendar-list.component.html',
  styleUrls: ['./calendar-list.component.scss'],
  imports: [CommonModule, IonicModule]
})
export class CalendarListComponent implements OnInit{
  calendars: any[] = []
  selectedCalendar: any

  constructor(private readonly calendarService: CalendarService) {}

  ngOnInit(): void {
    this.calendarService.calendars$.subscribe(calendars => {
      this.calendars = calendars;
    });

    this.calendarService.selectedCalendar$.subscribe(selectedCalendar => {
      this.selectedCalendar = selectedCalendar
    })
  }

  selectCalendar(calendarId: string): void {
    this.calendarService.setSelectedCalendar(calendarId)
  }

}
