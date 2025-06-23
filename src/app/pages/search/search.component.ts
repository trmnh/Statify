import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SpotifyPlayerService } from '../../services/player/spotify-player.service';
import { SpotifyTrack } from '../../interfaces/track.interface';
import { SpotifyArtist } from '../../interfaces/artist.interface';
import { SpotifyPlaylist } from '../../interfaces/playlist.interface';
import { SearchItem } from '../../interfaces/search.interface';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  searchForm: FormGroup;
  searchResults: SearchItem[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private playerService: SpotifyPlayerService
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
    });
  }

  ngOnInit() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe((term) => {
      if (term && term.length >= 2) {
        this.search(term);
      } else {
        this.searchResults = [];
      }
    });
  }

  search(term: string) {
    this.loading = true;
    this.error = null;

    this.playerService.searchAll(term).subscribe({
      next: (results) => {
        try {
          // Vérifier que les résultats sont valides
          if (
            results &&
            (results.tracks || results.artists || results.playlists)
          ) {
            this.searchResults = this.combineResults(results);
          } else {
            this.searchResults = [];
          }
          this.loading = false;
        } catch (error) {
          console.error('Erreur lors du traitement des résultats:', error);
          this.error = 'Erreur lors du traitement des résultats';
          this.searchResults = [];
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.error = 'Erreur lors de la recherche';
        this.loading = false;
      },
    });
  }

  combineResults(results: {
    tracks: SpotifyTrack[];
    artists: SpotifyArtist[];
    playlists: SpotifyPlaylist[];
  }): SearchItem[] {
    const combined: SearchItem[] = [];

    // Ajouter les tracks
    results.tracks?.forEach((track) => {
      combined.push({
        id: track.id,
        name: track.name,
        type: 'track',
        uri: track.uri,
        images: track.album?.images,
        artists: track.artists,
        album: track.album,
      });
    });

    // Ajouter les artistes
    results.artists?.forEach((artist) => {
      combined.push({
        id: artist.id,
        name: artist.name,
        type: 'artist',
        uri: `spotify:artist:${artist.id}`,
        images: artist.images,
        followers: artist.followers,
      });
    });

    // Ajouter les playlists
    results.playlists?.forEach((playlist) => {
      combined.push({
        id: playlist.id,
        name: playlist.name,
        type: 'playlist',
        uri: `spotify:playlist:${playlist.id}`,
        images: playlist.images,
        owner: playlist.owner,
        tracks: playlist.tracks,
      });
    });

    return combined;
  }

  handleItemClick(item: SearchItem) {
    switch (item.type) {
      case 'track':
        this.playTrack(item.uri);
        break;
      case 'artist':
        // Pour les artistes, on pourrait naviguer vers leur page ou jouer leur top tracks
        this.playArtistTopTracks(item.id);
        break;
      case 'playlist':
        this.playPlaylist(item.id);
        break;
    }
  }

  playTrack(uri: string) {
    this.playerService.playTrack(uri, true).subscribe({
      error: (error) => {
        console.error('Erreur lors de la lecture:', error);
        this.error = 'Erreur lors de la lecture';
      },
    });
  }

  playPlaylist(playlistId: string) {
    this.playerService.playPlaylist(playlistId, true).subscribe({
      error: (error) => {
        console.error('Erreur lors de la lecture de la playlist:', error);
        this.error = 'Erreur lors de la lecture de la playlist';
      },
    });
  }

  playArtistTopTracks(artistId: string) {
    this.playerService.playArtistTopTracks(artistId).subscribe({
      error: (error) => {
        console.error('Erreur lors de la lecture des top tracks:', error);
        this.error = 'Erreur lors de la lecture des top tracks';
      },
    });
  }

  getItemImage(item: SearchItem): string {
    return item.images?.[0]?.url || 'assets/default-image.png';
  }

  getItemSubtitle(item: SearchItem): string {
    switch (item.type) {
      case 'track':
        return `${this.formatArtistNames(item.artists)} • ${
          item.album?.name || ''
        }`;
      case 'artist':
        return `${item.followers?.total?.toLocaleString() || 0} abonnés`;
      case 'playlist':
        return `${item.owner?.display_name || ''} • ${
          item.tracks?.total || 0
        } titres`;
      default:
        return '';
    }
  }

  formatArtistNames(artists?: Array<{ name: string }>): string {
    return artists?.map((a) => a.name).join(', ') || '';
  }

  getItemIcon(item: SearchItem): string {
    switch (item.type) {
      case 'track':
        return 'musical-note';
      case 'artist':
        return 'person';
      case 'playlist':
        return 'list';
      case 'album':
        return 'disc';
      default:
        return 'musical-note';
    }
  }

  showPlayIcon(item: SearchItem): boolean {
    return (
      item.type === 'track' || item.type === 'playlist' || item.type === 'album'
    );
  }

  playItem(item: SearchItem) {
    if (item.type === 'track') {
      this.playTrack(item.uri);
    } else if (item.type === 'playlist') {
      this.playPlaylist(item.id);
    } else if (item.type === 'album') {
      // À implémenter si tu veux la lecture d'un album
      // this.playAlbum(item.id);
    }
  }

  showNoResults(): boolean {
    return (
      !this.loading &&
      !this.error &&
      this.searchResults.length === 0 &&
      !!this.searchForm.get('searchTerm')?.value
    );
  }

  showResults(): boolean {
    return !this.loading && !this.error && this.searchResults.length > 0;
  }

  showEmptyState(): boolean {
    return (
      !this.loading && !this.error && !this.searchForm.get('searchTerm')?.value
    );
  }

  trackById(index: number, item: SearchItem): string {
    return item.id;
  }
}
