import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home.page';
import { UserInfoPage } from '../user-info/user-info.page';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'app-user-info',
    component: UserInfoPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule {}
