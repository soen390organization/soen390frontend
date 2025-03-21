import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapSearchAnimation } from '../map-search/map-search.component';

@Component({
  selector: 'app-user-profile',
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  animations: MapSearchAnimation
})
export class UserProfileComponent {
  constructor() {}
}
