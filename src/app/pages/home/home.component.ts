import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { SpotifyService } from '../../services/spotify.service';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PlayerComponent } from '../../components/player/player.component';
import { SpotifyPlaylist, SpotifyProfile } from '../../interfaces/spotify.interface';
import { ProfilePopoverComponent } from '../../components/profile-popover/profile-popover.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, IonicModule, PlayerComponent],
})
export class HomeComponent implements OnInit {
  playlists: SpotifyPlaylist[] = [];
  isLoading = false;
  error: string | null = null;
  userProfile: SpotifyProfile | null = null;

  constructor(
    private spotifyService: SpotifyService,
    private router: Router,
    private popoverCtrl: PopoverController
  ) {}

  async presentPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: ProfilePopoverComponent,
      event: ev,
      translucent: true
    });
    await popover.present();
  }

  ngOnInit() {
    if (!this.spotifyService.isTokenValid()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadPlaylists();
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.spotifyService.getUserProfile().pipe(
      catchError(error => {
        console.error('Erreur lors du chargement du profil:', error);
        this.error = 'Erreur lors du chargement du profil';
        return of(null);
      })
    ).subscribe(profile => {
      this.userProfile = profile;
    });
  }

  loadPlaylists() {
    this.isLoading = true;
    this.error = null;

    this.spotifyService.getUserPlaylists().pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des playlists:', error);
        this.error = 'Erreur lors du chargement des playlists';
        return of([]);
      })
    ).subscribe(playlists => {
      this.playlists = playlists;
      this.isLoading = false;
    });
  }

  generateTopTracksPlaylist() {
    this.isLoading = true;
    this.error = null;

    this.spotifyService.createTopTracksPlaylist().pipe(
      switchMap(playlist => this.spotifyService.playPlaylist(playlist.id)),
      catchError(error => {
        console.error('Erreur lors de la génération de la playlist:', error);
        this.error = 'Erreur lors de la génération de la playlist';
        return of(null);
      })
    ).subscribe(() => {
      this.isLoading = false;
      this.loadPlaylists(); // Recharger les playlists pour voir la nouvelle
    });
  }

  playPlaylist(playlistId: string) {
    this.spotifyService.playPlaylist(playlistId).pipe(
      catchError(error => {
        console.error('Erreur lors de la lecture de la playlist:', error);
        this.error = 'Erreur lors de la lecture de la playlist';
        return of(null);
      })
    ).subscribe();
  }

  goToStats() {
    this.router.navigate(['/tabs/stats']);
  }

  logout() {
    localStorage.removeItem('spotifyToken');
    localStorage.removeItem('tokenExpiry');
    this.router.navigate(['/login']);
  }
}
