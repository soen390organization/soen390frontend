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
import { VisibilityService } from 'src/app/services/visibility.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'google-signin',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './google-signin.component.html',
  styleUrls: ['./google-signin.component.scss'],
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

export class GoogleSignInComponent implements OnInit {
  @ViewChild(GoogleMapComponent) googleMap!: GoogleMapComponent;
  enableStart$!: Observable<boolean>;

  constructor(
   private visibilityService: VisibilityService
  ) {}

  ngOnInit(): void {

  }
}
