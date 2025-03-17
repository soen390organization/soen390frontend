import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserInfoPageRoutingModule } from './user-info-routing.module';

import { UserInfoPage } from './user-info.page';
import { InteractionBarComponent } from '../components/interaction-bar/interaction-bar.component';
import { UserProfileComponent } from '../components/user-profile/user-profile.component';
import { GoogleSignInComponent } from '../components/google-signin/google-signin.component';
import { CalendarListComponent } from '../components/calendar-list/calendar-list.component';
import { EventDisplayComponent } from '../components/event-display/event-display.component';
import { UserInfoInteractionBarComponent } from '../components/user-info-interaction-bar/user-info-interaction-bar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserInfoPageRoutingModule,
    InteractionBarComponent,
    UserProfileComponent,
    GoogleSignInComponent,
    CalendarListComponent,
    EventDisplayComponent,
    UserInfoInteractionBarComponent
  ],
  declarations: [UserInfoPage]
})
export class UserInfoPageModule {}
