import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class LoginComponent {
  constructor() {
    this.checkForToken();
  }

  login() {
    const redirectUri = 'http://localhost:4200/login';

    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-library-read',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-top-read',
      'streaming',
      'user-read-recently-played',
    ].join('%20');

    const authUrl =
      `https://accounts.spotify.com/authorize` +
      `?client_id=${environment.spotifyClientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scopes}`;

    console.log('Redirection vers Spotify :', authUrl);
    window.location.href = authUrl;
  }

  checkForToken() {
    const hash = window.location.hash;
    console.log('checkForToken hash :', hash);

    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');

      if (token) {
        console.log('Token trouvé :', token);
        localStorage.setItem('spotifyToken', token);

        window.location.replace('/tabs/home');
      }
    }
  }
}
