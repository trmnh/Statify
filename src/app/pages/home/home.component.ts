import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { PlayerComponent } from '../../components/player/player.component';
import { SpotifyService } from '../../services/spotify.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [IonicModule, CommonModule, PlayerComponent],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router, private spotifyService: SpotifyService) {}

  userPlaylists = signal<any[]>([]);

  ngOnInit() {
    this.loadUserPlaylists();
  }

  goToStats() {
    this.router.navigate(['/tabs/stats']);
  }

  logout() {
    localStorage.removeItem('spotifyToken');
    this.router.navigate(['/login']);
  }

  playTrack(uri: string) {
    const token = localStorage.getItem('spotifyToken');
    if (!token) return;

    fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [uri] }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getArtistNames(track: any): string {
    return track.artists.map((a: any) => a.name).join(', ');
  }

  async loadUserPlaylists() {
    try {
      const playlists = await this.spotifyService.getUserPlaylists();
      this.userPlaylists.set(playlists);
    } catch (e) {
      console.error('Erreur chargement playlists utilisateur', e);
    }
  }

  openPlaylist(url: string) {
    window.open(url, '_blank');
  }

  async generateTopTracksPlaylist() {
    try {
      const result = await this.spotifyService.createTopTracksPlaylist();
      window.open(result.external_urls.spotify, '_blank');
    } catch (e) {
      console.error('Erreur création playlist', e);
    }
  }
}
