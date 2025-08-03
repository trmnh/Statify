import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { StreamingEntry } from '../../interfaces/streaming-entry.interface';

@Component({
  selector: 'app-genres-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <ion-icon name="musical-notes-outline"></ion-icon>
        <h3>Genres Écoutés</h3>
      </div>
      <div echarts [options]="chartOption" class="chart"></div>
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

      .chart {
        height: 300px;
        width: 100%;
      }

      @media (max-width: 768px) {
        .chart-container {
          padding: 16px;
          border-radius: 12px;
        }

        .chart-header h3 {
          font-size: 16px;
        }

        .chart {
          height: 250px;
        }
      }
    `,
  ],
})
export class GenresChartComponent implements OnChanges {
  @Input() entries: StreamingEntry[] = [];

  chartOption: any = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entries'] && this.entries.length > 0) {
      this.updateChart();
    }
  }

  private updateChart() {
    const genresData = this.calculateGenresData();

    this.chartOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: {
          color: '#ffffff',
        },
        formatter: (params: any) => {
          const hours =
            Math.round((params.value / (1000 * 60 * 60)) * 100) / 100;
          const minutes = Math.round((params.value / (1000 * 60)) % 60);
          return `${params.name}<br/>${hours}h ${minutes}min d'écoute<br/>${params.percent}%`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          color: '#b3b3b3',
          fontSize: 12,
        },
        itemGap: 12,
        itemWidth: 12,
        itemHeight: 12,
      },
      series: [
        {
          name: 'Genres',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#1a1a1a',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              color: '#ffffff',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          labelLine: {
            show: false,
          },
          data: genresData,
          color: [
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
            '#FF9FF3', // Rose
            '#54A0FF', // Bleu ciel
            '#5F27CD', // Violet foncé
            '#00D2D3', // Cyan
            '#FF9F43', // Orange clair
          ],
        },
      ],
    };
  }

  private calculateGenresData() {
    const genreMap = new Map<string, number>();

    // Filtrer les entrées valides
    const validEntries = this.entries.filter(
      (entry) =>
        !entry.skipped &&
        entry.ms_played > 0 &&
        entry.master_metadata_album_artist_name
    );

    validEntries.forEach((entry) => {
      const artistName = entry.master_metadata_album_artist_name;
      const genre = this.getGenreFromArtist(artistName);

      const existing = genreMap.get(genre) || 0;
      genreMap.set(genre, existing + entry.ms_played);
    });

    // Trier par temps d'écoute décroissant et prendre les 10 premiers
    const sortedGenres = Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return sortedGenres.map(([genre, totalMs]) => ({
      name: genre,
      value: totalMs,
    }));
  }

  private getGenreFromArtist(artistName: string): string {
    // Mapping d'artistes vers genres (exemples)
    const artistGenreMap: { [key: string]: string } = {
      // Pop
      'Taylor Swift': 'Pop',
      'Ed Sheeran': 'Pop',
      'Ariana Grande': 'Pop',
      'Dua Lipa': 'Pop',
      'The Weeknd': 'Pop',
      'Post Malone': 'Pop',
      Drake: 'Hip-Hop',
      'Kendrick Lamar': 'Hip-Hop',
      'Travis Scott': 'Hip-Hop',
      'J. Cole': 'Hip-Hop',
      Eminem: 'Hip-Hop',
      'Kanye West': 'Hip-Hop',
      // Rock
      'The Beatles': 'Rock',
      Queen: 'Rock',
      'Led Zeppelin': 'Rock',
      'Pink Floyd': 'Rock',
      Nirvana: 'Rock',
      Radiohead: 'Rock',
      'The Strokes': 'Rock',
      // Électronique
      'Daft Punk': 'Électronique',
      'The Chemical Brothers': 'Électronique',
      'Calvin Harris': 'Électronique',
      'David Guetta': 'Électronique',
      Skrillex: 'Électronique',
      // R&B
      'Frank Ocean': 'R&B',
      SZA: 'R&B',
      'H.E.R.': 'R&B',
      // Indie
      'Tame Impala': 'Indie',
      'Vampire Weekend': 'Indie',
      'The 1975': 'Indie',
      // Jazz
      'Miles Davis': 'Jazz',
      'John Coltrane': 'Jazz',
      'Herbie Hancock': 'Jazz',
      // Classique
      Mozart: 'Classique',
      Beethoven: 'Classique',
      Bach: 'Classique',
      Chopin: 'Classique',
    };

    // Vérifier si l'artiste est dans notre mapping
    if (artistGenreMap[artistName]) {
      return artistGenreMap[artistName];
    }

    // Si pas dans le mapping, essayer de deviner par des mots-clés
    const name = artistName.toLowerCase();

    if (name.includes('rap') || name.includes('hip') || name.includes('trap')) {
      return 'Hip-Hop';
    }
    if (
      name.includes('rock') ||
      name.includes('metal') ||
      name.includes('punk')
    ) {
      return 'Rock';
    }
    if (name.includes('jazz') || name.includes('blues')) {
      return 'Jazz';
    }
    if (
      name.includes('classic') ||
      name.includes('symphony') ||
      name.includes('orchestra')
    ) {
      return 'Classique';
    }
    if (
      name.includes('electronic') ||
      name.includes('edm') ||
      name.includes('techno')
    ) {
      return 'Électronique';
    }
    if (name.includes('country') || name.includes('folk')) {
      return 'Country/Folk';
    }
    if (name.includes('reggae') || name.includes('dancehall')) {
      return 'Reggae';
    }
    if (
      name.includes('latin') ||
      name.includes('salsa') ||
      name.includes('reggaeton')
    ) {
      return 'Latin';
    }

    // Par défaut, considérer comme Pop
    return 'Pop';
  }
}
