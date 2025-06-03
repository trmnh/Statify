import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import { play, pause, playCircle, pauseCircle } from 'ionicons/icons';
import { homeOutline, searchOutline, statsChartOutline } from 'ionicons/icons';

addIcons({
  'home-outline': homeOutline,
  'search-outline': searchOutline,
  'stats-chart-outline': statsChartOutline,
  play,
  pause,
  'play-circle': playCircle,
  'pause-circle': pauseCircle,
});

setTimeout(() => {
  document.querySelectorAll('.ion-page-hidden').forEach((p) => p.remove());
}, 300);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
});
