import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { DirectionsComponent } from '../components/directions/directions.component';

@NgModule({
  imports: [
    DirectionsComponent,
    GoogleMapComponent,
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
