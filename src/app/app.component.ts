import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  ngOnInit() {
    // Skip LogRocket initialization if running under Cypress tests
    if ((window as any).Cypress) {
      console.log('Skipping LogRocket during Cypress tests.');
      return;
    }
  }
}
