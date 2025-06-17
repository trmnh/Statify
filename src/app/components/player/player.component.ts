import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SpotifyService } from '../../services/spotify.service';
import { Subscription, interval } from 'rxjs';
import { addIcons } from 'ionicons';
import { play, pause, playBack, playForward } from 'ionicons/icons';
import { SpotifyPlayerService } from '../../services/player/spotify-player.service';
import { SpotifyDevice } from '../../interfaces/user.interface';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit, OnDestroy {
  private player: any;
  private deviceId: string | null = null;
  private token: string | null = null;
  public isPlaying = false;
  public currentTrack: any = null;
  private error: string | null = null;
  private subscription: Subscription = new Subscription();
  public currentPosition: number = 0;
  public duration: number = 0;
  private positionUpdateInterval: Subscription | null = null;
  devices: SpotifyDevice[] = [];

  constructor(private spotifyService: SpotifyService) {
    addIcons({
      play: play,
      pause: pause,
      'play-back': playBack,
      'play-forward': playForward,
    });
  }

  ngOnInit() {
    console.log('Initialisation du lecteur...');
    this.initPlayer();
  }

  ngOnDestroy() {
    console.log('Destruction du lecteur...');
    if (this.player) {
      this.player.disconnect();
    }
    this.subscription.unsubscribe();
    if (this.positionUpdateInterval) {
      this.positionUpdateInterval.unsubscribe();
    }
  }

  getArtistNames(): string {
    if (!this.currentTrack?.artists) return 'Aucun artiste';
    return this.currentTrack.artists.map((a: any) => a.name).join(', ');
  }

  private startPositionUpdates() {
    // unsubscribe si intervalle existe
    if (this.positionUpdateInterval) {
      this.positionUpdateInterval.unsubscribe();
    }

    // maj position toutes les secondes
    this.positionUpdateInterval = interval(1000).subscribe(async () => {
      if (this.player && this.isPlaying) {
        try {
          const state = await this.player.getCurrentState();
          if (state) {
            this.currentPosition = state.position;
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la position:', error);
        }
      }
    });
  }

  private initPlayer() {
    this.token = localStorage.getItem('spotifyToken');
    if (!this.token) {
      console.error('Token non trouvé');
      return;
    }

    console.log('Token trouvé, initialisation du SDK...');

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('SDK Spotify chargé');
      this.setupPlayer();
    };

    if (window.Spotify) {
      console.log('SDK Spotify déjà chargé');
      this.setupPlayer();
    } else {
      console.log('Chargement du SDK Spotify...');
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }

  private setupPlayer() {
    console.log('Configuration du lecteur...');
    this.player = new window.Spotify.Player({
      name: 'Statify Web Player',
      getOAuthToken: (cb: (token: string) => void) => {
        console.log('Demande de token...');
        cb(this.token!);
      },
      volume: 0.5,
    });

    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Lecteur prêt avec Device ID:', device_id);
      this.deviceId = device_id;
      this.isPlaying = false;
      this.transferPlayback();
      this.startPositionUpdates();
    });

    this.player.addListener(
      'not_ready',
      ({ device_id }: { device_id: string }) => {
        console.log('Lecteur non prêt:', device_id);
        this.isPlaying = false;
      }
    );

    this.player.addListener('player_state_changed', (state: any) => {
      console.log('État du lecteur changé:', state);
      if (state) {
        this.currentTrack = state.track_window.current_track;
        this.isPlaying = !state.paused;
        this.currentPosition = state.position;
        this.duration = state.duration;

        if (this.isPlaying) {
          this.startPositionUpdates();
        }
      }
    });

    this.player.addListener(
      'initialization_error',
      ({ message }: { message: string }) => {
        console.error("Erreur d'initialisation:", message);
        this.error = message;
      }
    );

    this.player.addListener(
      'authentication_error',
      ({ message }: { message: string }) => {
        console.error("Erreur d'authentification:", message);
        this.error = message;
      }
    );

    this.player.addListener(
      'account_error',
      ({ message }: { message: string }) => {
        console.error('Erreur de compte:', message);
        this.error = message;
      }
    );

    this.player.addListener(
      'playback_error',
      ({ message }: { message: string }) => {
        console.error('Erreur de lecture:', message);
        this.error = message;
      }
    );

    console.log('Tentative de connexion au lecteur...');
    this.player
      .connect()
      .then((success: boolean) => {
        if (success) {
          console.log('Connexion au lecteur réussie');
        } else {
          console.error('Échec de la connexion au lecteur');
        }
      })
      .catch((error: any) => {
        console.error('Erreur lors de la connexion au lecteur:', error);
      });
  }

  private transferPlayback() {
    if (!this.deviceId) {
      console.error('Pas de device ID disponible');
      return;
    }

    this.subscription.add(
      this.spotifyService.transferPlayback(this.deviceId).subscribe({
        next: () => console.log('Transfert de la lecture réussi'),
        error: (error) =>
          console.error('Erreur lors du transfert de la lecture:', error),
      })
    );
  }

  async togglePlay() {
    if (!this.player) {
      console.error('Lecteur non initialisé');
      return;
    }

    try {
      console.log('Toggle play/pause, état actuel:', this.isPlaying);
      if (this.isPlaying) {
        await this.player.pause();
      } else {
        const state = await this.player.getCurrentState();
        if (!state) {
          this.subscription.add(
            this.spotifyService.startPlayback().subscribe({
              next: () => console.log('Lecture démarrée'),
              error: (error) =>
                console.error('Erreur lors du démarrage de la lecture:', error),
            })
          );
        } else {
          await this.player.resume();
        }
      }
    } catch (error) {
      console.error('Erreur lors du contrôle de la lecture:', error);
    }
  }

  async nextTrack() {
    if (!this.player) {
      console.error('Lecteur non initialisé');
      return;
    }

    try {
      console.log('Passage à la piste suivante');
      await this.player.nextTrack();
    } catch (error) {
      console.error('Erreur lors du passage à la piste suivante:', error);
    }
  }

  async previousTrack() {
    if (!this.player) {
      console.error('Lecteur non initialisé');
      return;
    }

    try {
      console.log('Retour à la piste précédente');
      await this.player.previousTrack();
    } catch (error) {
      console.error('Erreur lors du retour à la piste précédente:', error);
    }
  }

  formatTime(ms: number): string {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async onSeek(event: any) {
    if (!this.player) {
      console.error('Lecteur non initialisé');
      return;
    }

    const position = (event.detail.value / 100) * this.duration;
    try {
      console.log('Changement de position:', position);
      await this.player.seek(position);
    } catch (error) {
      console.error('Erreur lors du changement de position:', error);
    }
  }
}
