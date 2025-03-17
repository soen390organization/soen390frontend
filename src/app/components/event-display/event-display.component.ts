import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CalendarEvent } from 'src/app/interfaces/event.interface';
import { CalendarService } from 'src/app/services/calendar/calendar.service';

@Component({
  selector: 'app-event-display',
  imports: [CommonModule],
  templateUrl: './event-display.component.html',
  styleUrls: ['./event-display.component.scss']
})
export class EventDisplayComponent {
  @Input() events: CalendarEvent[] = [];
  @Input() loading: boolean = false;

  constructor(private readonly calendarService: CalendarService) {}
}
