import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { MapSearchComponent } from '../components/map-search/map-search.component';
import { SwitchCampusButtonComponent } from '../components/switch-campus-button/switch-campus-button.component';
import { InteractionBarComponent } from "../components/interaction-bar/interaction-bar.component";

@NgModule({
  imports: [
    SwitchCampusButtonComponent,
    MapSearchComponent,
    GoogleMapComponent,
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    InteractionBarComponent,
],
  declarations: [HomePage],
  exports: [GoogleMapComponent]
})
export class HomePageModule {}
