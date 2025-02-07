import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { GoogleMapComponent } from '../components/google-map/google-map.component';


@NgModule({
  imports: [
    GoogleMapComponent,
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [HomePage],
  exports: [GoogleMapComponent]
})
export class HomePageModule {}
