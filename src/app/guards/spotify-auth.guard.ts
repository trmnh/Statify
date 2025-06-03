import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SpotifyService } from '../services/spotify.service';

export const spotifyAuthGuard: CanActivateFn = (route, state) => {
  const spotifyService = inject(SpotifyService);
  const router = inject(Router);

  if (spotifyService.isTokenValid()) {
    return true;
  }

  // Rediriger vers la page de login si non authentifié
  router.navigate(['/login']);
  return false;
}; 