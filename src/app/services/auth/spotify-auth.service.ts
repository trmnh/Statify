import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthService {
  private readonly clientId = environment.spotifyClientId;
  private readonly redirectUri = 'http://localhost:8100/callback';
  private readonly baseUrl = 'https://api.spotify.com/v1';

  constructor(private http: HttpClient, private router: Router) {}

  getHeaders(): HttpHeaders {
    if (!this.isTokenValid()) {
      console.log('Token invalide ou expiré');
      this.clearAuthData();
      this.router.navigate(['/login']);
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    const token = localStorage.getItem('spotifyToken');
    console.log(
      'Token utilisé pour la requête:',
      token ? 'Token présent' : 'Pas de token'
    );
    console.log('Token complet:', token);
    console.log('Expiration du token:', localStorage.getItem('tokenExpiry'));
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  handleError(error: HttpErrorResponse) {
    console.error('Une erreur est survenue:', error);

    // Si c'est une erreur 403 sur les likes, on ne déconnecte pas
    if (error.status === 403 && error.url?.includes('/me/tracks')) {
      console.error(
        'Erreur lors du like de la piste: Permissions insuffisantes'
      );
      return throwError(
        () =>
          new Error(
            'Impossible de liker la piste. Veuillez vérifier vos permissions Spotify.'
          )
      );
    }

    if (error.status === 401 || error.status === 403) {
      console.error(
        "Erreur d'authentification:",
        error.status === 401 ? 'Token expiré' : 'Permissions insuffisantes'
      );
      this.clearAuthData();
      this.router.navigate(['/login']);
      return throwError(
        () =>
          new Error(
            error.status === 401
              ? 'Session expirée, veuillez vous reconnecter'
              : 'Permissions insuffisantes, veuillez vous reconnecter'
          )
      );
    }
    return throwError(() => error);
  }

  isTokenValid(): boolean {
    const token = localStorage.getItem('spotifyToken');
    const expiry = localStorage.getItem('tokenExpiry');
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry);
  }

  clearAuthData(): void {
    localStorage.removeItem('spotifyToken');
    localStorage.removeItem('tokenExpiry');
  }

  getLoginUrl(): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-library-read',
      'user-library-modify',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-top-read',
      'streaming',
      'user-read-recently-played',
    ].join('%20');

    return `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${this.redirectUri}&scope=${scopes}&show_dialog=true`;
  }

  handleCallback(hash: string): void {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const scope = params.get('scope');

    console.log("Scopes reçus lors de l'authentification:", scope);
    console.log('Liste des scopes reçus:', scope?.split(' '));
    console.log('Token reçu:', token ? 'Token présent' : 'Pas de token');
    console.log('Durée de validité:', expiresIn);

    if (token && expiresIn) {
      localStorage.setItem('spotifyToken', token);
      localStorage.setItem(
        'tokenExpiry',
        (Date.now() + parseInt(expiresIn) * 1000).toString()
      );
      this.router.navigate(['/']);
    }
  }

  refreshToken(): Observable<string> {
    const token = localStorage.getItem('spotifyToken');
    if (!token) {
      this.router.navigate(['/login']);
      return throwError(() => new Error('Pas de token disponible'));
    }

    // Pour l'instant, on ne peut pas rafraîchir le token car Spotify ne fournit pas de refresh_token
    // avec le flow implicite. La seule solution est de rediriger vers la page de login
    this.clearAuthData();
    this.router.navigate(['/login']);
    return throwError(
      () => new Error('Session expirée, veuillez vous reconnecter')
    );
  }
}
