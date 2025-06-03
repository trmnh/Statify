import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SpotifyPlaylist, SpotifyProfile } from '../interfaces/spotify.interface';
import { Router } from '@angular/router';

interface SpotifyArtist {
  name: string;
  images: { url: string }[];
}

interface SpotifyTrack {
  uri: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
}

interface SpotifySearchResult {
  tracks?: {
    items: SpotifyTrack[];
  };
  artists?: {
    items: Array<{
      id: string;
      name: string;
      images: Array<{ url: string }>;
    }>;
  };
  albums?: {
    items: Array<{
      id: string;
      name: string;
      images: Array<{ url: string }>;
      artists: Array<{ name: string }>;
    }>;
  };
  playlists?: {
    items: SpotifyPlaylist[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private readonly baseUrl = 'https://api.spotify.com/v1';
  private readonly clientId = 'YOUR_CLIENT_ID';
  private readonly redirectUri = 'http://localhost:8100/callback';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('spotifyToken');
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('Token non trouvé');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Une erreur est survenue:', error);

    if (error.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('spotifyToken');
      localStorage.removeItem('tokenExpiry');
      this.router.navigate(['/login']);
      return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
    }

    return throwError(() => error);
  }

  isTokenValid(): boolean {
    const token = localStorage.getItem('spotifyToken');
    const expiry = localStorage.getItem('tokenExpiry');
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry);
  }

  search(query: string, type: string): Observable<any[]> {
    if (!query) return of([]);

    return this.http.get<SpotifySearchResult>(`${this.baseUrl}/search`, {
      params: {
        q: query,
        type: type,
        limit: '20'
      },
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        switch (type) {
          case 'track':
            return response.tracks?.items || [];
          case 'artist':
            return response.artists?.items || [];
          case 'album':
            return response.albums?.items || [];
          case 'playlist':
            return response.playlists?.items || [];
          default:
            return [];
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getUserProfile(): Observable<SpotifyProfile> {
    return this.http.get<SpotifyProfile>(`${this.baseUrl}/me`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getUserPlaylists(limit: number = 3): Observable<SpotifyPlaylist[]> {
    return this.http.get<{ items: SpotifyPlaylist[] }>(`${this.baseUrl}/me/playlists?limit=${limit}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.items),
      catchError(this.handleError.bind(this))
    );
  }

  getTopTracks(limit: number = 10): Observable<SpotifyTrack[]> {
    return this.http.get<{ items: SpotifyTrack[] }>(`${this.baseUrl}/me/top/tracks?limit=${limit}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.items),
      catchError(this.handleError.bind(this))
    );
  }

  getTopArtists(): Observable<SpotifyArtist[]> {
    return this.http.get<{ items: SpotifyArtist[] }>(`${this.baseUrl}/me/top/artists?limit=10`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.items),
      catchError(this.handleError.bind(this))
    );
  }

  getUserStats(): Observable<any> {
    return this.getUserProfile().pipe(
      switchMap(profile => 
        this.getTopTracks().pipe(
          map(tracks => ({
            profile,
            topTracks: tracks
          }))
        )
      ),
      catchError(this.handleError.bind(this))
    );
  }

  createTopTracksPlaylist(): Observable<SpotifyPlaylist> {
    return this.getUserProfile().pipe(
      switchMap(profile => {
        const playlistData = {
          name: 'Top Tracks Playlist',
          description: 'Playlist générée automatiquement avec vos titres préférés',
          public: false
        };

        return this.http.post<SpotifyPlaylist>(
          `${this.baseUrl}/users/${profile.id}/playlists`,
          playlistData,
          { headers: this.getHeaders() }
        );
      }),
      switchMap(playlist => {
        return this.getTopTracks().pipe(
          switchMap(tracks => {
            const trackUris = tracks.map(track => track.uri);
            return this.http.post(
              `${this.baseUrl}/playlists/${playlist.id}/tracks`,
              { uris: trackUris },
              { headers: this.getHeaders() }
            ).pipe(
              map(() => playlist)
            );
          })
        );
      }),
      catchError(this.handleError.bind(this))
    );
  }

  playTrack(uri: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/me/player/devices`, {
      headers: this.getHeaders()
    }).pipe(
      switchMap((response: any) => {
        const activeDevice = response.devices.find((device: any) => device.is_active);
        if (!activeDevice) {
          return throwError(() => new Error('Aucun appareil actif trouvé'));
        }

        return this.http.put(
          `${this.baseUrl}/me/player/play?device_id=${activeDevice.id}`,
          { uris: [uri] },
          { headers: this.getHeaders() }
        );
      }),
      catchError(this.handleError.bind(this))
    );
  }

  playPlaylist(playlistId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/me/player/devices`, {
      headers: this.getHeaders()
    }).pipe(
      switchMap((response: any) => {
        const devices = response.devices;
        const activeDevice = devices.find((device: any) => device.is_active) || devices[0];
        
        if (!activeDevice) {
          throw new Error('Aucun appareil actif trouvé');
        }

        return this.http.put(
          `${this.baseUrl}/me/player/play?device_id=${activeDevice.id}`,
          { context_uri: `spotify:playlist:${playlistId}` },
          { headers: this.getHeaders() }
        );
      }),
      catchError(this.handleError.bind(this))
    );
  }

  startPlayback(): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/me/player/play`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  transferPlayback(deviceId: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/me/player`,
      {
        device_ids: [deviceId],
        play: true
      },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}