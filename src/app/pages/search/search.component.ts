import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { SpotifyService } from '../../services/spotify.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface SearchResult {
  id: string;
  name: string;
  uri: string;
  images?: Array<{ url: string }>;
  artists?: Array<{ name: string }>;
  album?: {
    name: string;
    images: Array<{ url: string }>;
  };
}

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class SearchComponent implements OnInit {
  searchForm: FormGroup<{
    searchTerm: FormControl<string | null>;
    searchType: FormControl<string | null>;
  }>;
  searchResults: SearchResult[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private spotifyService: SpotifyService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      searchType: ['track']
    });
  }

  ngOnInit() {
    this.searchForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term) {
        this.search(term);
      } else {
        this.searchResults = [];
      }
    });

    this.searchForm.get('searchType')?.valueChanges.subscribe(() => {
      const term = this.searchForm.get('searchTerm')?.value;
      if (term) {
        this.search(term);
      }
    });
  }

  search(term: string) {
    this.isLoading = true;
    this.error = null;

    this.spotifyService.search(term, this.searchForm.get('searchType')?.value || 'track').subscribe({
      next: (items: SearchResult[]) => {
        this.searchResults = items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.error = 'Erreur lors de la recherche';
        this.isLoading = false;
      }
    });
  }

  playTrack(uri: string) {
    this.spotifyService.playTrack(uri).subscribe({
      error: (error) => {
        console.error('Erreur lors de la lecture:', error);
        this.error = 'Erreur lors de la lecture';
      }
    });
  }

  formatArtistNames(artists: Array<{ name: string }> | undefined): string {
    return artists?.map(a => a.name).join(', ') || '';
  }
}
