import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SpotifyAuthService } from '../auth/spotify-auth.service';
import { SpotifyProfile } from '../../interfaces/user.interface';
import { SpotifyTrack, AudioFeatures } from '../../interfaces/track.interface';
import { SpotifyArtist } from '../../interfaces/artist.interface';

@Injectable({
  providedIn: 'root',
})
export class SpotifyUserService {
  private readonly baseUrl = 'https://api.spotify.com/v1';

  constructor(
    private http: HttpClient,
    private authService: SpotifyAuthService
  ) {}

  getUserProfile(): Observable<SpotifyProfile> {
    return this.http
      .get<SpotifyProfile>(`${this.baseUrl}/me`, {
        headers: this.authService.getHeaders(),
      })
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }

  getTopTracks(
    limit: number = 10,
    time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Observable<SpotifyTrack[]> {
    return this.http
      .get<{ items: SpotifyTrack[] }>(
        `${this.baseUrl}/me/top/tracks?limit=${limit}&time_range=${time_range}`,
        { headers: this.authService.getHeaders() }
      )
      .pipe(
        map((response) => response.items),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }

  getTopArtists(
    limit: number = 10,
    time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Observable<SpotifyArtist[]> {
    return this.http
      .get<{ items: SpotifyArtist[] }>(
        `${this.baseUrl}/me/top/artists?limit=${limit}&time_range=${time_range}`,
        { headers: this.authService.getHeaders() }
      )
      .pipe(
        map((response) => response.items),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }

  getArtistTopTracks(artistId: string): Observable<SpotifyTrack[]> {
    return this.http
      .get<{ tracks: SpotifyTrack[] }>(
        `${this.baseUrl}/artists/${artistId}/top-tracks?market=from_token`,
        { headers: this.authService.getHeaders() }
      )
      .pipe(
        map((response) => response.tracks),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }

  getAudioFeatures(trackIds: string[]): Observable<AudioFeatures[]> {
    console.log(
      'Début de la requête audio features pour les tracks:',
      trackIds
    );
    const headers = this.authService.getHeaders();
    console.log('Headers utilisés:', headers.keys());
    console.log(
      'Token présent dans les headers:',
      headers.has('Authorization')
    );

    return this.http
      .get<{ audio_features: AudioFeatures[] }>(
        `${this.baseUrl}/audio-features?ids=${trackIds.join(',')}`,
        { headers }
      )
      .pipe(
        map((response) => {
          console.log('Réponse audio features reçue:', response);
          return response.audio_features;
        }),
        catchError((error) => {
          console.error(
            'Erreur détaillée lors de la récupération des audio features:',
            {
              status: error.status,
              message: error.message,
              error: error.error,
            }
          );
          if (error.status === 403) {
            console.error(
              'Token might not have the required scopes. Required scopes: user-top-read, user-read-private'
            );
            if (!this.authService.isTokenValid()) {
              console.log('Token expiré, redirection vers la page de login');
              this.authService.clearAuthData();
              throw new Error('Session expirée, veuillez vous reconnecter');
            }
          }
          return this.authService.handleError(error);
        })
      );
  }

  getUserStats(): Observable<{
    profile: SpotifyProfile;
    topTracks: SpotifyTrack[];
    topArtists: SpotifyArtist[];
  }> {
    return this.getUserProfile().pipe(
      switchMap((profile) =>
        this.getTopTracks().pipe(
          switchMap((tracks) =>
            this.getTopArtists().pipe(
              map((artists) => ({
                profile,
                topTracks: tracks,
                topArtists: artists,
              }))
            )
          )
        )
      ),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  likeTrack(trackId: string): Observable<void> {
    return this.http
      .put<void>(
        `${this.baseUrl}/me/tracks?ids=${trackId}`,
        {},
        { headers: this.authService.getHeaders() }
      )
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }

  getRecentlyPlayed(limit: number = 50): Observable<any[]> {
    return this.http
      .get<{ items: Array<{ track: SpotifyTrack; played_at: string }> }>(
        `${this.baseUrl}/me/player/recently-played?limit=${limit}`,
        { headers: this.authService.getHeaders() }
      )
      .pipe(
        map((response) => response.items),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }
}
