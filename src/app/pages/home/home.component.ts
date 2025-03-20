import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class HomeComponent {
  tracks: any[] = [];
  currentAudio: HTMLAudioElement | null = null;

  constructor(private router: Router, private spotifyService: SpotifyService) {
    this.checkAuthentication();
  }

  /**
   * Vérifie si l'utilisateur est connecté à Spotify.
   * S'il n'est pas connecté, il est redirigé vers la page de connexion.
   */
  checkAuthentication() {
    const token = localStorage.getItem("spotifyToken");
    if (!token) {
      console.log("🔴 Pas de token, retour à la connexion !");
      this.router.navigate(['/']); // Redirige vers login si non connecté
    } else {
      console.log("🟢 Utilisateur connecté avec token :", token);
    }
  }

  /**
   * Effectue une recherche de musique sur Spotify.
   * @param query - Texte entré par l'utilisateur
   */
  async search(query: string) {
    if (query.length > 2) {
      console.log("🔎 Recherche en cours :", query);
      this.tracks = await this.spotifyService.searchTracks(query);
    }
  }

  /**
   * Joue un extrait audio d'une musique.
   * @param url - URL de l'extrait
   */
  playPreview(url: string) {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }

    this.currentAudio = new Audio(url);
    this.currentAudio.play();
  }

  /**
   * Déconnecte l'utilisateur et le redirige vers la page de connexion.
   */
  logout() {
    localStorage.removeItem("spotifyToken");
    this.router.navigate(['/']);
  }

  goToStats() {
    this.router.navigate(['/stats']);
  }
  

}
