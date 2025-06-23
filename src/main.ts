import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import {
  play,
  pause,
  playCircle,
  pauseCircle,
  arrowBackOutline,
  chevronDown,
  playBack,
  playForward,
  homeOutline,
  searchOutline,
  statsChartOutline,
  musicalNotesOutline,
  compassOutline,
  discOutline,
  discSharp,
  musicalNote,
  disc,
  person,
  list,
} from 'ionicons/icons';

addIcons({
  'home-outline': homeOutline,
  'search-outline': searchOutline,
  'stats-chart-outline': statsChartOutline,
  'musical-notes-outline': musicalNotesOutline,
  'arrow-back-outline': arrowBackOutline,
  'chevron-down': chevronDown,
  'play-back': playBack,
  'play-forward': playForward,
  play,
  pause,
  'play-circle': playCircle,
  'pause-circle': pauseCircle,
  'compass-outline': compassOutline,
  'disc-outline': discOutline,
  'disc-sharp': discSharp,
  'musical-note': musicalNote,
  disc: disc,
  person: person,
  list: list,
});

setTimeout(() => {
  document.querySelectorAll('.ion-page-hidden').forEach((p) => p.remove());
}, 300);

bootstrapApplication(AppComponent, appConfig);
