import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import LogRocket from 'logrocket';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    LogRocket.identify('Randy', {
      name: 'Andrei Mihaescu',
      email: 'andreimihaescu@hotmail.com'
      // Additional custom properties can go here
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        LogRocket.log('Navigated to: ' + event.urlAfterRedirects);
      }
    });
  }
}
