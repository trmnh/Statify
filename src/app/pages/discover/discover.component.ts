import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SpotifyService } from '../../services/spotify.service';
import { SpotifyUserService } from '../../services/user/spotify-user.service';
import { SpotifyAuthService } from '../../services/auth/spotify-auth.service';
import { SpotifyTrack } from '../../interfaces/track.interface';
import { SpotifyArtist } from '../../interfaces/artist.interface';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  forkJoin,
  from,
  of,
  firstValueFrom,
} from 'rxjs';
import {
  catchError,
  concatMap,
  distinct,
  filter,
  map,
  toArray,
} from 'rxjs/operators';
import { SpotifyPlayerService } from '../../services/player/spotify-player.service';
import { PlayerComponent } from '../../components/player/player.component';
import { SpotifyPlaylistService } from '../../services/playlist/spotify-playlist.service';
import { addIcons } from 'ionicons';
import { close, star, heart } from 'ionicons/icons';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, PlayerComponent],
})
export class DiscoverComponent implements OnInit {
  private userService = inject(SpotifyUserService);
  private authService = inject(SpotifyAuthService);
  private spotifyService = inject(SpotifyService);
  private playerService = inject(SpotifyPlayerService);
  private playlistService = inject(SpotifyPlaylistService);

  private recommendationQueueSubject = new BehaviorSubject<SpotifyTrack[]>([]);
  recommendationQueue$: Observable<SpotifyTrack[]> =
    this.recommendationQueueSubject.asObservable();

  private currentTrackSubject = new BehaviorSubject<SpotifyTrack | null>(null);
  currentTrack$: Observable<SpotifyTrack | null> =
    this.currentTrackSubject.asObservable();

  private likedTrackIds = new Set<string>();
  private dislikedTrackIds = new Set<string>();
  private superlikePlaylistId: string | null = null;
  private superlikePlaylistName = 'Discover Superlikes';

  isLoading = false;
  error: string | null = null;
  currentCardAnimationClass: string = '';
  isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;

  constructor() {
    addIcons({
      close: close,
      star: star,
      heart: heart,
    });
  }

  ngOnInit() {
    this.loadInitialRecommendations();
    this.initializeSuperlikePlaylist();
  }

  private async initializeSuperlikePlaylist() {
    try {
      const playlists = await firstValueFrom(
        this.playlistService.getUserPlaylists(50)
      );
      const superlike = playlists.find(
        (p) => p.name === this.superlikePlaylistName
      );

      if (superlike) {
        this.superlikePlaylistId = superlike.id;
        console.log('Playlist Superlike trouvée:', superlike.id);
      } else {
        const newPlaylist = await firstValueFrom(
          this.playlistService.createPlaylist(
            this.superlikePlaylistName,
            'Morceaux superlikés depuis Discover'
          )
        );
        this.superlikePlaylistId = newPlaylist.id;
        console.log('Nouvelle playlist Superlike créée:', newPlaylist.id);
      }
    } catch (err) {
      console.error(
        "Erreur lors de l'initialisation de la playlist Superlike:",
        err
      );
    }
  }

  async loadInitialRecommendations() {
    if (!this.authService.isTokenValid()) {
      this.error = 'Votre session a expiré. Veuillez vous reconnecter.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const topArtists = await firstValueFrom(
        this.userService.getTopArtists(10, 'long_term')
      );

      if (!topArtists || topArtists.length === 0) {
        // Si pas d'artistes, on essaie de charger des recommandations basées sur des genres populaires
        const recommendations = await firstValueFrom(
          this.spotifyService.getRecommendations(20)
        );

        if (recommendations && recommendations.length > 0) {
          this.recommendationQueueSubject.next(
            this.shuffleArray(recommendations)
          );
          this.nextTrack();
        } else {
          throw new Error('Impossible de charger des recommandations.');
        }
        return;
      }

      const topTracksObservables = topArtists.map((artist) =>
        this.userService.getArtistTopTracks(artist.id).pipe(
          catchError((err) => {
            console.warn(
              `Could not get top tracks for artist ${artist.name}:`,
              err
            );
            return of<SpotifyTrack[]>([]);
          })
        )
      );

      const allTracks = await firstValueFrom(
        forkJoin(topTracksObservables).pipe(
          map((arrays) => arrays.flat()),
          concatMap((tracks) => from(tracks)),
          filter(
            (track) =>
              track &&
              !this.likedTrackIds.has(track.id) &&
              !this.dislikedTrackIds.has(track.id)
          ),
          distinct((track) => track.id),
          toArray()
        )
      );

      if (allTracks && allTracks.length > 0) {
        this.recommendationQueueSubject.next(this.shuffleArray(allTracks));
        this.nextTrack();
      } else {
        throw new Error('Aucune piste trouvée pour les artistes sélectionnés.');
      }
    } catch (err: any) {
      console.error(
        'Erreur lors du chargement initial des recommandations:',
        err
      );
      if (err.status === 401 || err.status === 403) {
        this.authService.clearAuthData();
        this.error = "Erreur d'authentification. Veuillez vous reconnecter.";
      } else {
        this.error =
          err.message ||
          'Erreur inconnue lors du chargement des recommandations.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  onSwipeLeft() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
    this.currentCardAnimationClass = 'swiping-left';
    setTimeout(() => {
      const currentTrack = this.currentTrackSubject.value;
      if (currentTrack) {
        this.dislikedTrackIds.add(currentTrack.id);
      }
      this.nextTrack();
      this.currentCardAnimationClass = '';
    }, 300);
  }

  onSwipeRight() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
    this.currentCardAnimationClass = 'swiping-right';
    setTimeout(async () => {
      const currentTrack = this.currentTrackSubject.value;
      if (currentTrack) {
        this.likedTrackIds.add(currentTrack.id);
        try {
          await firstValueFrom(this.userService.likeTrack(currentTrack.id));
        } catch (err) {
          console.warn('Impossible de liker la piste sur Spotify:', err);
          // On continue même si le like échoue
        }
      }
      this.nextTrack();
      this.currentCardAnimationClass = '';
    }, 300);
  }

  private nextTrack() {
    const queue = this.recommendationQueueSubject.value;
    if (queue.length > 0) {
      const next = queue.shift();
      this.currentTrackSubject.next(next || null);
      this.recommendationQueueSubject.next(queue);
    } else {
      this.currentTrackSubject.next(null);
      this.error =
        'Plus de recommandations. Veuillez recharger la page ou essayer plus tard.';
      // Optionnel: Tenter de charger de nouvelles recommandations automatiquement
      // this.loadInitialRecommendations();
    }
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  formatArtists(artists: { name: string }[]): string {
    return artists.map((a) => a.name).join(', ');
  }

  togglePlay(audioElement: HTMLAudioElement) {
    const track = this.currentTrackSubject.value;
    if (!track) return;

    // Si on change de morceau, on arrête l'ancien
    if (this.currentTrackId !== track.id) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      this.currentTrackId = track.id;
      this.currentAudio = audioElement;
    }

    if (audioElement.paused) {
      // Arrêter tous les autres lecteurs audio
      document.querySelectorAll('audio').forEach((audio) => {
        if (audio !== audioElement) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      audioElement
        .play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch((error) => {
          console.error('Erreur lors de la lecture:', error);
          this.isPlaying = false;
        });
    } else {
      audioElement.pause();
      this.isPlaying = false;
    }

    // Gérer la fin de la lecture
    audioElement.onended = () => {
      this.isPlaying = false;
    };

    // Gérer les erreurs de lecture
    audioElement.onerror = () => {
      console.error('Erreur de lecture audio');
      this.isPlaying = false;
    };
  }

  playInApp(track: SpotifyTrack) {
    this.playerService.playTrack(track.uri).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Erreur lors de la lecture dans Spotify :', err);
        // Optionnel : afficher une notification à l'utilisateur
      },
    });
  }

  async onSuperlike(track: SpotifyTrack) {
    try {
      // Ajouter aux likes Spotify
      try {
        await firstValueFrom(this.userService.likeTrack(track.id));
      } catch (err) {
        console.warn('Impossible de liker la piste sur Spotify:', err);
      }

      // S'assurer que nous avons une playlist Superlike
      if (!this.superlikePlaylistId) {
        await this.initializeSuperlikePlaylist();
        if (!this.superlikePlaylistId) {
          throw new Error(
            'Impossible de créer ou trouver la playlist Superlike'
          );
        }
      }

      // Ajouter le morceau à la playlist Superlike
      try {
        await firstValueFrom(
          this.playlistService.addTracksToPlaylist(this.superlikePlaylistId, [
            track.uri,
          ])
        );
        console.log('Piste ajoutée à la playlist Superlike:', track.name);
      } catch (err) {
        console.warn(
          "Impossible d'ajouter la piste à la playlist Superlike:",
          err
        );
      }

      // Ajouter aux likes locaux
      this.likedTrackIds.add(track.id);

      // Passer à la piste suivante
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.isPlaying = false;
      }
      this.nextTrack();
    } catch (err) {
      console.error('Erreur lors du superlike:', err);
      this.nextTrack();
    }
  }
}
