import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import LogRocket from 'logrocket';

LogRocket.init('i6ifl9/campusguide');

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
