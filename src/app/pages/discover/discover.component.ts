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
  private discoverPlaylistId: string | null = null;
  private discoverPlaylistName = 'Discover Spotify';
  private readonly DISCOVER_PLAYLIST_KEY = 'statify_discover_playlist_id';

  isLoading = false;
  error: string | null = null;
  currentCardAnimationClass: string = '';
  isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;

  constructor() {
    // Pas besoin d'ajouter des icônes pour les symboles Unicode
  }

  ngOnInit() {
    this.loadInitialRecommendations();
    this.initializeDiscoverPlaylist();
  }

  private async initializeDiscoverPlaylist() {
    try {
      // D'abord, essayer de récupérer l'ID depuis le localStorage
      const savedPlaylistId = localStorage.getItem(this.DISCOVER_PLAYLIST_KEY);

      if (savedPlaylistId) {
        // Vérifier si la playlist existe toujours
        try {
          const playlist = await firstValueFrom(
            this.playlistService.getPlaylist(savedPlaylistId)
          );
          if (playlist) {
            this.discoverPlaylistId = savedPlaylistId;
            console.log(
              'Playlist Discover récupérée depuis le cache:',
              savedPlaylistId
            );
            return;
          }
        } catch (err) {
          console.log(
            "Playlist sauvegardée introuvable, recherche d'une nouvelle..."
          );
        }
      }

      // Si pas d'ID sauvegardé ou playlist introuvable, chercher dans les playlists existantes
      const playlists = await firstValueFrom(
        this.playlistService.getUserPlaylists(50)
      );

      // Chercher une playlist avec le nom exact
      let discover = playlists.find(
        (p) => p.name === this.discoverPlaylistName
      );

      if (discover) {
        this.discoverPlaylistId = discover.id;
        localStorage.setItem(this.DISCOVER_PLAYLIST_KEY, discover.id);
        console.log('Playlist Discover trouvée:', discover.id);
      } else {
        // Créer une nouvelle playlist seulement si aucune n'existe
        const newPlaylist = await firstValueFrom(
          this.playlistService.createPlaylist(
            this.discoverPlaylistName,
            'Morceaux découverts et aimés via Statify'
          )
        );
        this.discoverPlaylistId = newPlaylist.id;
        localStorage.setItem(this.DISCOVER_PLAYLIST_KEY, newPlaylist.id);
        console.log('Nouvelle playlist Discover créée:', newPlaylist.id);
      }
    } catch (err) {
      console.error(
        "Erreur lors de l'initialisation de la playlist Discover:",
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

        // Liker la piste sur Spotify
        try {
          await firstValueFrom(this.userService.likeTrack(currentTrack.id));
          console.log('Piste likée sur Spotify:', currentTrack.name);
        } catch (err) {
          console.warn('Impossible de liker la piste sur Spotify:', err);
        }

        // Ajouter à la playlist Discover Spotify
        try {
          // S'assurer qu'on a une playlist Discover
          if (!this.discoverPlaylistId) {
            await this.initializeDiscoverPlaylist();
          }

          if (this.discoverPlaylistId) {
            await firstValueFrom(
              this.playlistService.addTracksToPlaylist(
                this.discoverPlaylistId,
                [currentTrack.uri]
              )
            );
            console.log(
              'Piste ajoutée à la playlist Discover Spotify:',
              currentTrack.name
            );
          } else {
            console.warn(
              "Impossible de récupérer l'ID de la playlist Discover"
            );
          }
        } catch (err) {
          console.warn(
            "Impossible d'ajouter la piste à la playlist Discover Spotify:",
            err
          );
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
}
