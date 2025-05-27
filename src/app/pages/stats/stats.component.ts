import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class StatsComponent implements OnInit {
  userProfile = signal<any | null>(null);
  topArtists = signal<any[]>([]);
  topTracks = signal<any[]>([]);

  private spotifyService = inject(SpotifyService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.spotifyService.isTokenValid()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStats();
  }

  async loadStats() {
    try {
      const profile = await this.spotifyService.getUserProfile();
      const artists = await this.spotifyService.getTopArtists();
      const tracks = await this.spotifyService.getTopTracks();

      this.userProfile.set(profile);
      this.topArtists.set(artists);
      this.topTracks.set(tracks);
    } catch (error) {
      console.error('Erreur API Spotify', error);
      this.router.navigate(['/login']);
    }
  }

  getArtistNames(track: any): string {
    return track.artists.map((a: any) => a.name).join(', ');
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }
}
