import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-top-tracks-cards',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="musical-note-outline"></ion-icon>
        <h3>Top 10 Morceaux</h3>
      </div>
      <div class="tracks-grid">
        @for (track of topTracks; track track.id; let i = $index) {
        <div class="track-card" [class.top-3]="i < 3">
          <div class="rank">{{ i + 1 }}</div>
          <div class="track-info">
            <h4 class="track-name">{{ track.name }}</h4>
            <p class="track-artist">{{ track.artist }}</p>
            <p class="track-stats">
              {{ formatDuration(track.totalMs) }} • {{ track.count }} écoutes
            </p>
          </div>
          <div class="track-bar">
            <div
              class="bar-fill"
              [style.width.%]="getBarPercentage(track.totalMs)"
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

      .tracks-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .track-card {
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

      .track-card:hover {
        transform: translateX(4px);
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--ion-color-primary);
      }

      .track-card.top-3 {
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

      .track-card.top-3 .rank {
        background: linear-gradient(135deg, #1db954, #1ed760);
        box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
      }

      .track-info {
        flex: 1;
        min-width: 0;
      }

      .track-name {
        margin: 0 0 4px 0;
        color: var(--ion-color-light);
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .track-artist {
        margin: 0 0 4px 0;
        color: var(--ion-color-tertiary);
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .track-stats {
        margin: 0;
        color: var(--ion-color-tertiary);
        font-size: 11px;
      }

      .track-bar {
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

        .track-card {
          padding: 10px 12px;
        }

        .track-name {
          font-size: 14px;
        }

        .track-artist {
          font-size: 12px;
        }

        .track-stats {
          font-size: 10px;
        }

        .track-bar {
          width: 60px;
        }
      }
    `,
  ],
})
export class TopTracksCardsComponent implements OnChanges {
  @Input() entries: StreamingEntry[] = [];

  topTracks: Array<{
    id: string;
    name: string;
    artist: string;
    totalMs: number;
    count: number;
  }> = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries'] && this.entries.length > 0) {
      this.calculateTopTracks();
    }
  }

  private calculateTopTracks() {
    const trackMap = new Map<
      string,
      {
        name: string;
        artist: string;
        totalMs: number;
        count: number;
      }
    >();

    // Filtrer les entrées valides
    const validEntries = this.entries.filter(
      (entry) =>
        !entry.skipped &&
        entry.ms_played > 0 &&
        entry.master_metadata_track_name &&
        entry.master_metadata_album_artist_name
    );

    validEntries.forEach((entry) => {
      const trackKey = `${entry.master_metadata_track_name} - ${entry.master_metadata_album_artist_name}`;
      const existing = trackMap.get(trackKey);

      if (existing) {
        existing.totalMs += entry.ms_played;
        existing.count += 1;
      } else {
        trackMap.set(trackKey, {
          name: entry.master_metadata_track_name,
          artist: entry.master_metadata_album_artist_name,
          totalMs: entry.ms_played,
          count: 1,
        });
      }
    });

    this.topTracks = Array.from(trackMap.entries())
      .map(([id, track]) => ({ ...track, id }))
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
    if (this.topTracks.length === 0) return 0;
    const maxMs = this.topTracks[0].totalMs;
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
