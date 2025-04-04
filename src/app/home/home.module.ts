import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { GoogleMapComponent } from '../components/google-map/google-map.component';
import { MapSearchComponent } from '../components/map-search/map-search.component';
import { SwitchCampusButtonComponent } from '../components/switch-campus-button/switch-campus-button.component';
import { InteractionBarComponent } from '../components/interaction-bar/interaction-bar.component';
import { MappedinMapComponent } from '../components/mappedin-map/mappedin-map.component';
import { SwitchMapButtonComponent } from '../components/switch-map-button/switch-map-button.component';
import { UserProfileComponent } from '../components/user-profile/user-profile.component';

@NgModule({
  imports: [
    SwitchCampusButtonComponent,
    MappedinMapComponent,
    MapSearchComponent,
    GoogleMapComponent,
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    InteractionBarComponent,
    UserProfileComponent
  ],
  declarations: [HomePage],
  exports: [GoogleMapComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePageModule {}
