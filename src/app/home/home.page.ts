import { Component } from '@angular/core';
import { MappedinService } from 'src/app/services/mappedIn.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage {
  constructor(public mappedinService: MappedinService) {}
}
