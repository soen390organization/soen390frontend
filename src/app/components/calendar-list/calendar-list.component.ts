import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from 'src/app/services/calendar/calendar.service';

@Component({
  selector: 'calendar-list',
  templateUrl: './calendar-list.component.html',
  styleUrls: ['./calendar-list.component.scss'],
  imports: [CommonModule]
})
export class CalendarList implements OnInit{
  calendars: any[] = []
  selectedCalendar: any

  constructor(private readonly calendarService: CalendarService) {}

  ngOnInit(): void {
    this.calendarService.calendars$.subscribe(calendars => {
      this.calendars = calendars;
      console.log('Updated Calendars:', this.calendars);
    });

    this.calendarService.selectedCalendar$.subscribe(selectedCalendar => {
      this.selectedCalendar = selectedCalendar
      console.log("updated selectedCalendar:", this.selectedCalendar)
    })
  }

}
