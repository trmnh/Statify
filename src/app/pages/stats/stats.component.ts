import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of, BehaviorSubject, Observable, map } from 'rxjs';

interface SpotifyArtist {
  name: string;
  images: Array<{ url: string }>;
}

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string }>;
  };
}

interface SpotifyProfile {
  display_name: string;
  images: Array<{ url: string }>;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class StatsComponent implements OnInit {
  private userProfileSubject = new BehaviorSubject<SpotifyProfile | null>(null);
  userProfile$: Observable<SpotifyProfile | null> = this.userProfileSubject.asObservable();

  private topArtistsSubject = new BehaviorSubject<SpotifyArtist[]>([]);
  topArtists$: Observable<SpotifyArtist[]> = this.topArtistsSubject.asObservable();

  private topTracksSubject = new BehaviorSubject<SpotifyTrack[]>([]);
  topTracks$: Observable<SpotifyTrack[]> = this.topTracksSubject.asObservable();

  hasProfileImage$: Observable<boolean> = this.userProfile$.pipe(
    map(profile => !!profile?.images?.length)
  );


  profileImageUrl$: Observable<string | undefined> = this.userProfile$.pipe(
    map(profile => profile?.images?.[0]?.url)
  );

  private spotifyService = inject(SpotifyService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.spotifyService.isTokenValid()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStats();
  }

  loadStats() {
    console.log('Début du chargement des statistiques');
    forkJoin({
      profile: this.spotifyService.getUserProfile(),
      artists: this.spotifyService.getTopArtists(),
      tracks: this.spotifyService.getTopTracks()
    }).pipe(
      catchError(error => {
        console.error('Erreur détaillée lors du chargement des statistiques:', error);
        this.router.navigate(['/login']);
        return of({ profile: null, artists: [], tracks: [] });
      })
    ).subscribe({
      next: ({ profile, artists, tracks }) => {
        console.log('Données reçues:', { 
          profile, 
          artistsCount: artists?.length || 0,
          artists: artists,
          tracksCount: tracks?.length || 0,
          tracks: tracks
        });
        this.userProfileSubject.next(profile);
        this.topArtistsSubject.next(artists || []);
        this.topTracksSubject.next(tracks || []);
      },
      error: (error) => {
        console.error('Erreur dans la souscription:', error);
      }
    });
  }

  
  formatArtistNames(artists: Array<{ name: string }> | undefined): string {
    if (!artists) return '';
    return artists.map(a => a.name).join(', ');
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }
}
