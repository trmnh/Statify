import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SpotifyAuthService } from '../auth/spotify-auth.service';
import { SpotifyUserService } from '../user/spotify-user.service';
import { SpotifyPlaylist } from '../../interfaces/playlist.interface';
import { SpotifyTrack } from '../../interfaces/track.interface';

@Injectable({
  providedIn: 'root',
})
export class SpotifyPlaylistService {
  private readonly baseUrl = 'https://api.spotify.com/v1';

  constructor(
    private http: HttpClient,
    private authService: SpotifyAuthService,
    private userService: SpotifyUserService
  ) {}

  getUserPlaylists(limit: number = 20): Observable<SpotifyPlaylist[]> {
    return this.http
      .get<{ items: SpotifyPlaylist[] }>(
        `${this.baseUrl}/me/playlists?limit=${limit}`,
        { headers: this.authService.getHeaders() }
      )
      .pipe(
        map((response) => response.items),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }

  getPlaylist(playlistId: string): Observable<SpotifyPlaylist> {
    return this.http
      .get<SpotifyPlaylist>(`${this.baseUrl}/playlists/${playlistId}`, {
        headers: this.authService.getHeaders(),
      })
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }

  createPlaylist(
    name: string,
    description: string = '',
    isPublic: boolean = false
  ): Observable<SpotifyPlaylist> {
    return this.userService.getUserProfile().pipe(
      switchMap((profile) => {
        const playlistData = {
          name,
          description,
          public: isPublic,
        };

        return this.http.post<SpotifyPlaylist>(
          `${this.baseUrl}/users/${profile.id}/playlists`,
          playlistData,
          { headers: this.authService.getHeaders() }
        );
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  addTracksToPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Observable<any> {
    return this.http
      .post(
        `${this.baseUrl}/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        { headers: this.authService.getHeaders() }
      )
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }

  createTopTracksPlaylist(): Observable<SpotifyPlaylist> {
    return this.userService.getUserProfile().pipe(
      switchMap((profile) => {
        const playlistData = {
          name: 'Top Tracks Playlist',
          description:
            'Playlist générée automatiquement avec vos titres préférés',
          public: false,
        };

        return this.http.post<SpotifyPlaylist>(
          `${this.baseUrl}/users/${profile.id}/playlists`,
          playlistData,
          { headers: this.authService.getHeaders() }
        );
      }),
      switchMap((playlist) => {
        return this.userService.getTopTracks().pipe(
          switchMap((tracks) => {
            const trackUris = tracks.map((track) => track.uri);
            return this.addTracksToPlaylist(playlist.id, trackUris).pipe(
              map(() => playlist)
            );
          })
        );
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  removeTracksFromPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/playlists/${playlistId}/tracks`, {
        headers: this.authService.getHeaders(),
        body: { uris: trackUris },
      })
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }
}
