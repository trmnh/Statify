import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

declare global {
  interface Window {
    Spotify: any;
  }
}

@Component({
  selector: 'app-player',
  standalone: true,
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  imports: [CommonModule, IonicModule],
})
export class PlayerComponent implements OnInit {
  trackName = '';
  artistName = '';
  albumImage = '';
  isPlaying = false;
  currentPosition = 0;
  duration = 0;
  progressInterval: any;

  private player: any;

  ngOnInit(): void {
    // Charger dynamiquement le SDK si pas encore dispo
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.onload = () => this.initPlayer();
      document.body.appendChild(script);
    } else {
      this.initPlayer();
    }
  }

  initPlayer() {
    const token = localStorage.getItem('spotifyToken');
    if (!token) {
      console.error('Token Spotify manquant.');
      return;
    }

    this.player = new window.Spotify.Player({
      name: 'Statify Player',
      getOAuthToken: (cb: (t: string) => void) => cb(token),
      volume: 0.8,
    });

    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Lecteur prêt avec ID :', device_id);
      this.transferPlaybackToDevice(device_id, token);
    });

    this.player.addListener('player_state_changed', (state: any) => {
      if (!state) return;

      const current = state.track_window.current_track;
      this.trackName = current.name;
      this.artistName = current.artists.map((a: any) => a.name).join(', ');
      this.albumImage = current.album.images[0]?.url;
      this.isPlaying = !state.paused;
      this.duration = state.duration;
      this.currentPosition = state.position;

      if (this.isPlaying) {
        this.startProgressUpdater();
      } else {
        this.stopProgressUpdater();
      }
    });

    this.player.addListener('initialization_error', ({ message }: any) =>
      console.error('Erreur init', message)
    );
    this.player.addListener('authentication_error', ({ message }: any) =>
      console.error('Erreur auth', message)
    );
    this.player.addListener('account_error', ({ message }: any) =>
      console.error('Erreur compte', message)
    );
    this.player.addListener('playback_error', ({ message }: any) =>
      console.error('Erreur lecture', message)
    );

    this.player.connect();
  }

  transferPlaybackToDevice(deviceId: string, token: string) {
    fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  }

  togglePlayback() {
    this.player.togglePlay().then(() => {
      this.isPlaying = !this.isPlaying;
    });
  }
  startProgressUpdater() {
    this.stopProgressUpdater();
    this.progressInterval = setInterval(() => {
      if (this.currentPosition < this.duration) {
        this.currentPosition += 1000;
      }
    }, 1000);
  }

  stopProgressUpdater() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  onSeek(event: any) {
    const percent = event.detail.value;
    const newPositionMs = (percent / 100) * this.duration;

    this.player.seek(newPositionMs).then(() => {
      this.currentPosition = newPositionMs;
      console.log(`Position changée à ${this.formatTime(newPositionMs)}`);
    });
  }
}
