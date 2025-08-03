import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-top-artists-cards',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="people-outline"></ion-icon>
        <h3>Top 10 Artistes</h3>
      </div>
      <div class="artists-grid">
        @for (artist of topArtists; track artist.name; let i = $index) {
        <div class="artist-card" [class.top-3]="i < 3">
          <div class="rank">{{ i + 1 }}</div>
          <div class="artist-info">
            <h4 class="artist-name">{{ artist.name }}</h4>
            <p class="artist-stats">
              {{ formatDuration(artist.totalMs) }} • {{ artist.count }} écoutes
            </p>
          </div>
          <div class="artist-bar">
            <div
              class="bar-fill"
              [style.width.%]="getBarPercentage(artist.totalMs)"
              [style.background]="getBarColor(i)"
            ></div>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .chart-container {
        background: var(--ion-color-secondary);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        border: 1px solid var(--ion-color-tertiary);
        transition: all 0.3s ease-in-out;
      }

      .chart-container:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
      }

      .chart-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--ion-color-tertiary);
      }

      .chart-header ion-icon {
        font-size: 24px;
        color: var(--ion-color-primary);
        margin-right: 12px;
      }

      .chart-header h3 {
        margin: 0;
        color: var(--ion-color-light);
        font-size: 18px;
        font-weight: 600;
      }

      .artists-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .artist-card {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .artist-card:hover {
        transform: translateX(4px);
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--ion-color-primary);
      }

      .artist-card.top-3 {
        background: linear-gradient(
          135deg,
          rgba(29, 185, 84, 0.1),
          rgba(30, 215, 96, 0.05)
        );
        border-color: var(--ion-color-primary);
      }

      .rank {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--ion-color-primary);
        color: white;
        border-radius: 50%;
        font-weight: bold;
        font-size: 14px;
        margin-right: 16px;
        flex-shrink: 0;
      }

      .artist-card.top-3 .rank {
        background: linear-gradient(135deg, #1db954, #1ed760);
        box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
      }

      .artist-info {
        flex: 1;
        min-width: 0;
      }

      .artist-name {
        margin: 0 0 4px 0;
        color: var(--ion-color-light);
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .artist-stats {
        margin: 0;
        color: var(--ion-color-tertiary);
        font-size: 12px;
      }

      .artist-bar {
        width: 80px;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-left: 12px;
        flex-shrink: 0;
      }

      .bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.6s ease;
      }

      @media (max-width: 768px) {
        .chart-container {
          padding: 16px;
          border-radius: 12px;
        }

        .chart-header h3 {
          font-size: 16px;
        }

        .artist-card {
          padding: 10px 12px;
        }

        .artist-name {
          font-size: 14px;
        }

        .artist-stats {
          font-size: 11px;
        }

        .artist-bar {
          width: 60px;
        }
      }
    `,
  ],
})
export class TopArtistsCardsComponent implements OnChanges {
  @Input() entries: StreamingEntry[] = [];

  topArtists: Array<{ name: string; totalMs: number; count: number }> = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries'] && this.entries.length > 0) {
      this.calculateTopArtists();
    }
  }

  private calculateTopArtists() {
    const artistMap = new Map<string, { totalMs: number; count: number }>();

    // Filtrer les entrées valides
    const validEntries = this.entries.filter(
      (entry) =>
        !entry.skipped &&
        entry.ms_played > 0 &&
        entry.master_metadata_album_artist_name
    );

    validEntries.forEach((entry) => {
      const artistName = entry.master_metadata_album_artist_name;
      const existing = artistMap.get(artistName) || { totalMs: 0, count: 0 };
      artistMap.set(artistName, {
        totalMs: existing.totalMs + entry.ms_played,
        count: existing.count + 1,
      });
    });

    this.topArtists = Array.from(artistMap.entries())
      .map(([name, stats]) => ({
        name,
        totalMs: stats.totalMs,
        count: stats.count,
      }))
      .sort((a, b) => b.totalMs - a.totalMs)
      .slice(0, 10);
  }

  formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  getBarPercentage(totalMs: number): number {
    if (this.topArtists.length === 0) return 0;
    const maxMs = this.topArtists[0].totalMs;
    return (totalMs / maxMs) * 100;
  }

  getBarColor(index: number): string {
    const colors = [
      '#1DB954', // Vert Spotify
      '#1ED760', // Vert plus clair
      '#FF6B6B', // Rouge
      '#4ECDC4', // Turquoise
      '#45B7D1', // Bleu
      '#FFD93D', // Jaune
      '#6BCF7F', // Vert clair
      '#4D96FF', // Bleu clair
      '#9B59B6', // Violet
      '#E67E22', // Orange
    ];
    return colors[index] || colors[0];
  }
}
