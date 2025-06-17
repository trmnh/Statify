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

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  searchForm: FormGroup;
  searchResults: {
    tracks?: SpotifyTrack[];
    artists?: SpotifyArtist[];
    playlists?: SpotifyPlaylist[];
  } = {};
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private playerService: SpotifyPlayerService
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      searchType: ['track'],
    });
  }

  ngOnInit() {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe((term) => {
      if (term) {
        this.search(term);
      } else {
        this.searchResults = {};
      }
    });
  }

  search(term: string) {
    this.loading = true;
    this.error = null;

    const searchType = this.searchForm.get('searchType')?.value || 'track';
    this.playerService.search(term, searchType).subscribe({
      next: (results) => {
        this.searchResults = { [searchType]: results };
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.error = 'Erreur lors de la recherche';
        this.loading = false;
      },
    });
  }

  playTrack(uri: string) {
    this.playerService.playTrack(uri).subscribe({
      error: (error) => {
        console.error('Erreur lors de la lecture:', error);
        this.error = 'Erreur lors de la lecture';
      },
    });
  }

  handleItemClick(item: SpotifyTrack | SpotifyArtist | SpotifyPlaylist) {
    if ('uri' in item) {
      this.playTrack(item.uri);
    }
  }

  getItemImage(item: SpotifyTrack | SpotifyArtist | SpotifyPlaylist): string {
    if ('images' in item && item.images?.[0]?.url) {
      return item.images[0].url;
    }
    return 'assets/default-image.png';
  }

  getItemArtists(item: SpotifyTrack | SpotifyArtist | SpotifyPlaylist): string {
    if ('artists' in item && item.artists) {
      return this.formatArtistNames(item.artists);
    }
    return '';
  }

  formatArtistNames(artists: Array<{ name: string }> | undefined): string {
    return artists?.map((a) => a.name).join(', ') || '';
  }

  getCurrentResults(): SpotifyTrack[] | SpotifyArtist[] | SpotifyPlaylist[] {
    const type = this.searchForm.get('searchType')?.value || 'track';
    return this.searchResults[type as keyof typeof this.searchResults] || [];
  }
}
