import { Component } from '@angular/core';
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
export class StatsComponent {
  topArtists: any[] = [];
  topTracks: any[] = [];

  constructor(private router: Router, private spotifyService: SpotifyService) {
    this.checkAuthentication();
    this.loadStats();
  }

  checkAuthentication() {
    const token = localStorage.getItem("spotifyToken");
    if (!token) {
      this.router.navigate(['/']); // Redirige vers login si non connecté
    }
  }

  async loadStats() {
    console.log("📊 Chargement des statistiques...");
    this.topArtists = await this.spotifyService.getTopArtists();
    this.topTracks = await this.spotifyService.getTopTracks();
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}

