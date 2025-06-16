import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { catchError, forkJoin, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
}

interface AudioFeatures {
  valence: number;
  energy: number;
  danceability: number;
  acousticness: number;
  tempo: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  imports: [
    IonicModule,
    CommonModule,
    NgxEchartsModule,
    RouterModule,
    FormsModule
  ]
})
export class StatsComponent implements OnInit {
  private spotifyService = inject(SpotifyService);
  private router = inject(Router);

  selectedPeriod: 'short_term' | 'medium_term' | 'long_term' = 'medium_term';

  artistsChartOption: any = {
    title: {
      text: 'Top 10 Artistes',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: 'Popularité'
    },
    series: [{
      data: [],
      type: 'bar',
      itemStyle: {
        color: '#1DB954'
      }
    }]
  };

  tracksChartOption: any = {
    title: {
      text: 'Top 10 Pistes',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: 'Popularité'
    },
    series: [{
      data: [],
      type: 'bar',
      itemStyle: {
        color: '#1DB954'
      }
    }]
  };

  genresChartOption: any = {
    title: {
      text: 'Distribution des Genres',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: []
    },
    series: [{
      name: 'Genres',
      type: 'pie',
      radius: '50%',
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  durationChartOption: any = {
    title: {
      text: 'Durée des Pistes',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: [],
      name: 'Pistes'
    },
    yAxis: {
      type: 'value',
      name: 'Durée (secondes)'
    },
    series: [{
      data: [],
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#1DB954'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(29, 185, 84, 0.5)'
          }, {
            offset: 1,
            color: 'rgba(29, 185, 84, 0.1)'
          }]
        }
      }
    }]
  };

  radarChartOption: any = {
    title: {
      text: 'Profil Musical',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const values = params.value;
        const indicators = [
          { name: 'Valence', format: (v: number) => Math.round(v * 100) + '%' },
          { name: 'Énergie', format: (v: number) => Math.round(v * 100) + '%' },
          { name: 'Dansabilité', format: (v: number) => Math.round(v * 100) + '%' },
          { name: 'Acoustique', format: (v: number) => Math.round(v * 100) + '%' },
          { name: 'Tempo', format: (v: number) => Math.round(v * 200) + ' BPM' }
        ];
        
        let result = params.name + '<br/>';
        values.forEach((value: number, index: number) => {
          const indicator = indicators[index];
          result += `${indicator.name}: ${indicator.format(value)}<br/>`;
        });
        return result;
      }
    },
    radar: {
      indicator: [
        { name: 'Valence', max: 1, min: 0 },
        { name: 'Énergie', max: 1, min: 0 },
        { name: 'Dansabilité', max: 1, min: 0 },
        { name: 'Acoustique', max: 1, min: 0 },
        { name: 'Tempo', max: 1, min: 0 }
      ],
      splitNumber: 5,
      axisName: {
        color: '#333',
        fontSize: 12,
        padding: [3, 5]
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#999'
        }
      },
      axisTick: {
        show: true,
        length: 3
      },
      axisLabel: {
        show: true,
        formatter: function(value: number) {
          return Math.round(value * 100) + '%';
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [0, 0, 0, 0, 0],
        name: 'Profil Musical',
        areaStyle: {
          color: 'rgba(29, 185, 84, 0.3)'
        },
        lineStyle: {
          color: '#1DB954',
          width: 2
        },
        itemStyle: {
          color: '#1DB954'
        }
      }]
    }]
  };

  constructor() {}

  ngOnInit() {
    this.loadStats();
  }

  onPeriodChange(event: any) {
    this.loadStats();
  }

  loadStats() {
    forkJoin({
      topArtists: this.spotifyService.getTopArtists(10, this.selectedPeriod),
      topTracks: this.spotifyService.getTopTracks(20, this.selectedPeriod)
    }).pipe(
      catchError(error => {
        console.error('Error loading stats:', error);
        return of({ topArtists: [], topTracks: [] });
      })
    ).subscribe(data => {
      // Mise à jour des données des graphiques
      this.updateArtistsChart(data.topArtists);
      this.updateTracksChart(data.topTracks);
      this.updateGenresChart(data.topArtists);
      this.updateDurationChart(data.topTracks);
      
      // Récupérer les audio features pour le radar chart
      if (data.topTracks.length > 0) {
        const trackIds = data.topTracks
          .map(track => track.uri.split(':').pop())
          .filter((id): id is string => id !== undefined);
        
        if (trackIds.length > 0) {
          this.spotifyService.getAudioFeatures(trackIds).subscribe((features: AudioFeatures[]) => {
            this.updateRadarChart(features);
          });
        }
      }
    });
  }

  private updateArtistsChart(artists: any[]) {
    this.artistsChartOption = {
      ...this.artistsChartOption,
      xAxis: {
        ...this.artistsChartOption.xAxis,
        data: artists.map(artist => artist.name)
      },
      series: [{
        ...this.artistsChartOption.series[0],
        data: artists.map(artist => artist.popularity)
      }]
    };
  }

  private updateTracksChart(tracks: any[]) {
    this.tracksChartOption = {
      ...this.tracksChartOption,
      xAxis: {
        ...this.tracksChartOption.xAxis,
        data: tracks.map(track => track.name)
      },
      series: [{
        ...this.tracksChartOption.series[0],
        data: tracks.map(track => track.popularity)
      }]
    };
  }

  private updateGenresChart(artists: any[]) {
    const genreStats = this.calculateGenreStats(artists);
    this.genresChartOption = {
      ...this.genresChartOption,
      legend: {
        ...this.genresChartOption.legend,
        data: genreStats.map(genre => genre.name)
      },
      series: [{
        ...this.genresChartOption.series[0],
        data: genreStats.map(genre => ({
          name: genre.name,
          value: genre.count
        }))
      }]
    };
  }

  private updateDurationChart(tracks: any[]) {
    this.durationChartOption = {
      ...this.durationChartOption,
      xAxis: {
        ...this.durationChartOption.xAxis,
        data: tracks.map(track => track.name)
      },
      series: [{
        ...this.durationChartOption.series[0],
        data: tracks.map(track => track.duration_ms / 1000)
      }]
    };
  }

  private updateRadarChart(features: AudioFeatures[]) {
    if (!features || features.length === 0) {
      console.warn('No audio features data available');
      return;
    }

    const averages = this.calculateAudioFeaturesAverages(features);
    this.radarChartOption = {
      ...this.radarChartOption,
      series: [{
        ...this.radarChartOption.series[0],
        data: [{
          value: [
            averages.valence,
            averages.energy,
            averages.danceability,
            averages.acousticness,
            averages.tempo
          ],
          name: 'Profil Musical'
        }]
      }]
    };
  }

  private calculateAudioFeaturesAverages(features: AudioFeatures[]): {
    valence: number;
    energy: number;
    danceability: number;
    acousticness: number;
    tempo: number;
  } {
    if (!features || features.length === 0) {
      return {
        valence: 0,
        energy: 0,
        danceability: 0,
        acousticness: 0,
        tempo: 0
      };
    }

    const sum = features.reduce((acc, feature) => ({
      valence: acc.valence + (feature.valence || 0),
      energy: acc.energy + (feature.energy || 0),
      danceability: acc.danceability + (feature.danceability || 0),
      acousticness: acc.acousticness + (feature.acousticness || 0),
      tempo: acc.tempo + ((feature.tempo || 0) / 200) // Normalisation du tempo (200 BPM max)
    }), {
      valence: 0,
      energy: 0,
      danceability: 0,
      acousticness: 0,
      tempo: 0
    });

    const count = features.length;
    return {
      valence: sum.valence / count,
      energy: sum.energy / count,
      danceability: sum.danceability / count,
      acousticness: sum.acousticness / count,
      tempo: sum.tempo / count
    };
  }

  private calculateGenreStats(artists: any[]): { name: string; count: number }[] {
    const genreCount: { [key: string]: number } = {};
    artists.forEach(artist => {
      artist.genres.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
    return Object.entries(genreCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
