import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class LoginComponent {
  constructor(private router: Router) {
    this.checkForToken();
  }

  login() {
    const authUrl = `https://accounts.spotify.com/authorize` +
      `?client_id=${environment.spotifyClientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(environment.spotifyRedirectUri)}` +
      `&scope=user-library-read%20user-top-read%20user-read-private`;

    window.location.href = authUrl;
  }

  checkForToken() {
    const hash = window.location.hash;
    console.log("URL après redirection :", hash); // 🔍 Vérifie ce qui est dans l’URL après connexion

    if (hash.includes("access_token")) {
      const token = new URLSearchParams(hash.substring(1)).get("access_token");

      if (token) {
        console.log("Token récupéré :", token); // 🔍 Vérifie que le token est bien extrait
        localStorage.setItem("spotifyToken", token);
        window.history.replaceState({}, document.title, "/home"); // Enlève le token de l’URL
        this.router.navigate(['/home']); // Redirige vers la page d'accueil
      }
    }
  }
}
