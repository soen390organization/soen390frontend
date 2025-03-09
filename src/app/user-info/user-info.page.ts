import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CalendarService } from '../services/calendar/calendar.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
  standalone: false
})

export class UserInfoPage{
  calendars: any[] = []

  constructor(private router: Router, private readonly calendarService: CalendarService) {
  }

  openHomePage() {
    this.router.navigate(['home']);
  }

  async signInWithGoogle() {
    this.calendarService.signInWithGoogle()
  }
}
