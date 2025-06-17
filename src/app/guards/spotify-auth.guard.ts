import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyAuthService } from '../services/auth/spotify-auth.service';

export const spotifyAuthGuard = () => {
  const router = inject(Router);
  const authService = inject(SpotifyAuthService);

  if (authService.isTokenValid()) {
    return true;
  }

  return router.parseUrl('/login');
};
