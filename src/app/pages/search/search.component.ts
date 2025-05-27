import { Component, signal, inject, OnInit } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  imports: [IonicModule, CommonModule, FormsModule],
})
export class SearchComponent implements OnInit {
  private spotifyService = inject(SpotifyService);
  private router = inject(Router);

  searchTerm = signal('');
  results = signal<any[]>([]);
  selectedType: 'track' | 'artist' | 'album' = 'track';

  ngOnInit() {
    if (!this.spotifyService.isTokenValid()) {
      this.router.navigate(['/login']);
      return;
    }
  }

  async search(term: string) {
    this.searchTerm.set(term);
    if (!term) {
      this.results.set([]);
      return;
    }

    const items = await this.spotifyService.search(term, this.selectedType);
    this.results.set(items);
  }

  onTypeChange(type: 'track' | 'artist' | 'album') {
    this.selectedType = type;
    this.search(this.searchTerm());
  }

  playPreview(url: string) {
    const audio = new Audio(url);
    audio.play();
  }

  getArtistNames(item: any): string {
    return item.artists?.map((a: any) => a.name).join(', ') || '';
  }
}
