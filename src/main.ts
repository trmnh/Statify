import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import { play, pause, playCircle, pauseCircle } from 'ionicons/icons';
import { homeOutline, searchOutline, statsChartOutline, musicalNotesOutline } from 'ionicons/icons';

addIcons({
  'home-outline': homeOutline,
  'search-outline': searchOutline,
  'stats-chart-outline': statsChartOutline,
  'musical-notes-outline': musicalNotesOutline,
  play,
  pause,
  'play-circle': playCircle,
  'pause-circle': pauseCircle,
});

setTimeout(() => {
  document.querySelectorAll('.ion-page-hidden').forEach((p) => p.remove());
}, 300);

bootstrapApplication(AppComponent, appConfig);
