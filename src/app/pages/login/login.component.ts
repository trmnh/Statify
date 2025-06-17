import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class LoginComponent {
  constructor(private router: Router) {
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
      `&scope=${scopes}` +
      `&show_dialog=true` +
      `&state=${Math.random().toString(36).substring(2)}`;

    console.log('Redirection vers Spotify :', authUrl);
    window.location.href = authUrl;
  }

  checkForToken() {
    const hash = window.location.hash;
    console.log('checkForToken hash :', hash);

    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const expiresIn = params.get('expires_in');

      if (token && expiresIn) {
        console.log('Token trouvé :', token);
        localStorage.setItem('spotifyToken', token);

        const expiryTime = Date.now() + parseInt(expiresIn) * 1000;
        localStorage.setItem('tokenExpiry', expiryTime.toString());

        this.router.navigate(['/tabs/home']);
      }
    }
  }
}
