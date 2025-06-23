import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { SpotifyAuthService } from '../auth/spotify-auth.service';
import { SpotifyDevice } from '../../interfaces/user.interface';
import { SpotifyTrack } from '../../interfaces/track.interface';
import { SpotifyArtist } from '../../interfaces/artist.interface';
import { SpotifyPlaylist } from '../../interfaces/playlist.interface';

interface SpotifySearchResult {
  tracks?: {
    items: SpotifyTrack[];
  };
  artists?: {
    items: SpotifyArtist[];
  };
  playlists?: {
    items: SpotifyPlaylist[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class SpotifyPlayerService {
  private readonly baseUrl = 'https://api.spotify.com/v1';

  constructor(
    private http: HttpClient,
    private authService: SpotifyAuthService
  ) {}

  search(
    query: string,
    type: string
  ): Observable<SpotifyTrack[] | SpotifyArtist[] | SpotifyPlaylist[]> {
    if (!query) return new Observable((subscriber) => subscriber.next([]));

    return this.http
      .get<SpotifySearchResult>(`${this.baseUrl}/search`, {
        params: {
          q: query,
          type: type,
          limit: '20',
        },
        headers: this.authService.getHeaders(),
      })
      .pipe(
        map((response) => {
          switch (type) {
            case 'track':
              return response.tracks?.items || [];
            case 'artist':
              return response.artists?.items || [];
            case 'playlist':
              return response.playlists?.items || [];
            default:
              return [];
          }
        }),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }

  searchAll(query: string): Observable<{
    tracks: SpotifyTrack[];
    artists: SpotifyArtist[];
    playlists: SpotifyPlaylist[];
  }> {
    if (!query) {
      return new Observable((subscriber) =>
        subscriber.next({ tracks: [], artists: [], playlists: [] })
      );
    }

    return this.http
      .get<SpotifySearchResult>(`${this.baseUrl}/search`, {
        params: {
          q: query,
          type: 'track,artist,playlist',
          limit: '10',
        },
        headers: this.authService.getHeaders(),
      })
      .pipe(
        map((response) => ({
          tracks:
            response.tracks?.items?.filter(
              (item) => item && item.id && item.name
            ) || [],
          artists:
            response.artists?.items?.filter(
              (item) => item && item.id && item.name
            ) || [],
          playlists:
            response.playlists?.items?.filter(
              (item) => item && item.id && item.name
            ) || [],
        })),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }

  playTrack(uri: string, play: boolean = false): Observable<any> {
    return this.getActiveDevice().pipe(
      switchMap((device) => {
        if (!device) {
          return throwError(() => new Error('Aucun appareil actif trouvé'));
        }

        return this.http.put(
          `${this.baseUrl}/me/player/play?device_id=${device.id}`,
          { uris: [uri], play: play },
          { headers: this.authService.getHeaders() }
        );
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  playPlaylist(playlistId: string, play: boolean = false): Observable<any> {
    return this.getActiveDevice().pipe(
      switchMap((device) => {
        if (!device) {
          return throwError(() => new Error('Aucun appareil actif trouvé'));
        }

        return this.http.put(
          `${this.baseUrl}/me/player/play?device_id=${device.id}`,
          { context_uri: `spotify:playlist:${playlistId}`, play: play },
          { headers: this.authService.getHeaders() }
        );
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  pausePlayback(): Observable<any> {
    return this.http
      .put(
        `${this.baseUrl}/me/player/pause`,
        {},
        { headers: this.authService.getHeaders() }
      )
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }

  resumePlayback(): Observable<any> {
    return this.http
      .put(
        `${this.baseUrl}/me/player/play`,
        {},
        { headers: this.authService.getHeaders() }
      )
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }

  getActiveDevice(): Observable<SpotifyDevice | null> {
    return this.http
      .get<{ devices: SpotifyDevice[] }>(`${this.baseUrl}/me/player/devices`, {
        headers: this.authService.getHeaders(),
      })
      .pipe(
        map((response) => {
          const activeDevice = response.devices.find(
            (device) => device.is_active
          );
          return activeDevice || response.devices[0] || null;
        }),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }

  transferPlayback(deviceId: string): Observable<any> {
    return this.http
      .put(
        `${this.baseUrl}/me/player`,
        { device_ids: [deviceId], play: false },
        { headers: this.authService.getHeaders() }
      )
      .pipe(catchError(this.authService.handleError.bind(this.authService)));
  }

  playArtistTopTracks(artistId: string): Observable<any> {
    return this.http
      .get<{ tracks: SpotifyTrack[] }>(
        `${this.baseUrl}/artists/${artistId}/top-tracks`,
        {
          params: { market: 'from_token' },
          headers: this.authService.getHeaders(),
        }
      )
      .pipe(
        switchMap((response) => {
          if (response.tracks && response.tracks.length > 0) {
            const uris = response.tracks.map((track) => track.uri);
            return this.getActiveDevice().pipe(
              switchMap((device) => {
                if (!device) {
                  return throwError(
                    () => new Error('Aucun appareil actif trouvé')
                  );
                }
                return this.http.put(
                  `${this.baseUrl}/me/player/play?device_id=${device.id}`,
                  { uris: uris, play: true },
                  { headers: this.authService.getHeaders() }
                );
              })
            );
          } else {
            return throwError(
              () => new Error('Aucun top track trouvé pour cet artiste')
            );
          }
        }),
        catchError(this.authService.handleError.bind(this.authService))
      );
  }
}
