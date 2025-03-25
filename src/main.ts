import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import LogRocket from 'logrocket';

// Only initialize LogRocket if Cypress isn't running
if (!(window as any).Cypress) {
  LogRocket.init('i6ifl9/campusguide');
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
