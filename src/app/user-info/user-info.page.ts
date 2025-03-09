import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { CalendarService } from '../services/calendar/calendar.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
  standalone: false
})

export class UserInfoPage implements OnInit {
  constructor(private router: Router, private readonly calendarService: CalendarService) {
  }

  ngOnInit() {
  }

  openHomePage() {
    this.router.navigate(['home']);
  }

  async signInWithGoogle() {
    this.calendarService.signInWithGoogle()
  }
}
