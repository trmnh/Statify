import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../../services/spotify.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { catchError, forkJoin, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { SpotifyUserService } from '../../services/user/spotify-user.service';
import { SpotifyPlaylistService } from '../../services/playlist/spotify-playlist.service';
import { SpotifyTrack, AudioFeatures } from '../../interfaces/track.interface';
import { SpotifyArtist } from '../../interfaces/artist.interface';
import { SpotifyAuthService } from '../../services/auth/spotify-auth.service';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  switchMap,
  map,
  startWith,
} from 'rxjs';

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
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class StatsComponent implements OnInit {
  private spotifyService = inject(SpotifyService);
  private router = inject(Router);
  private userService = inject(SpotifyUserService);
  private playlistService = inject(SpotifyPlaylistService);
  private authService = inject(SpotifyAuthService);

  selectedPeriodControl = new FormControl<
    'short_term' | 'medium_term' | 'long_term'
  >('medium_term');
  topArtists$ = new BehaviorSubject<SpotifyArtist[]>([]);
  topTracks$ = new BehaviorSubject<SpotifyTrack[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  artistsChartOption: any = {
    title: {
      text: 'Top 10 Artistes',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 0,
        rotate: 30,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Popularité',
    },
    series: [
      {
        data: [],
        type: 'bar',
        itemStyle: {
          color: '#1DB954',
        },
      },
    ],
  };

  tracksChartOption: any = {
    title: {
      text: 'Top 10 Pistes',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 0,
        rotate: 30,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Popularité',
    },
    series: [
      {
        data: [],
        type: 'bar',
        itemStyle: {
          color: '#1DB954',
        },
      },
    ],
  };

  genresChartOption: any = {
    title: {
      text: 'Distribution des Genres',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: [],
    },
    series: [
      {
        name: 'Genres',
        type: 'pie',
        radius: '50%',
        data: [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  durationChartOption: any = {
    title: {
      text: 'Durée des Pistes',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: [],
      name: 'Pistes',
    },
    yAxis: {
      type: 'value',
      name: 'Durée (secondes)',
    },
    series: [
      {
        data: [],
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#1DB954',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(29, 185, 84, 0.5)',
              },
              {
                offset: 1,
                color: 'rgba(29, 185, 84, 0.1)',
              },
            ],
          },
        },
      },
    ],
  };

  constructor() {}

  ngOnInit() {
    this.selectedPeriodControl.valueChanges
      .pipe(
        startWith(this.selectedPeriodControl.value),
        switchMap((period) => {
          this.loading$.next(true);
          this.error$.next(null);
          return combineLatest([
            this.userService.getTopArtists(10, period!),
            this.userService.getTopTracks(20, period!),
          ]);
        })
      )
      .subscribe({
        next: ([artists, tracks]) => {
          this.topArtists$.next(artists);
          this.topTracks$.next(tracks);
          this.loading$.next(false);
          this.updateCharts();
        },
        error: (error) => {
          if (error.status === 401 || error.status === 403) {
            this.authService.clearAuthData();
            this.router.navigate(['/login']);
          }
          this.error$.next('Erreur lors du chargement des données');
          this.loading$.next(false);
        },
      });
  }

  updateCharts() {
    this.updateArtistsChart(this.topArtists$.value);
    this.updateTracksChart(this.topTracks$.value);
    this.updateGenresChart(this.topArtists$.value);
    this.updateDurationChart(this.topTracks$.value);
  }

  private updateArtistsChart(artists: any[]) {
    this.artistsChartOption = {
      ...this.artistsChartOption,
      xAxis: {
        ...this.artistsChartOption.xAxis,
        data: artists.map((artist) => artist.name),
      },
      series: [
        {
          ...this.artistsChartOption.series[0],
          data: artists.map((artist) => artist.popularity),
        },
      ],
    };
  }

  private updateTracksChart(tracks: any[]) {
    this.tracksChartOption = {
      ...this.tracksChartOption,
      xAxis: {
        ...this.tracksChartOption.xAxis,
        data: tracks.map((track) => track.name),
      },
      series: [
        {
          ...this.tracksChartOption.series[0],
          data: tracks.map((track) => track.popularity),
        },
      ],
    };
  }

  private updateGenresChart(artists: any[]) {
    const genreStats = this.calculateGenreStats(artists);
    this.genresChartOption = {
      ...this.genresChartOption,
      legend: {
        ...this.genresChartOption.legend,
        data: genreStats.map((genre) => genre.name),
      },
      series: [
        {
          ...this.genresChartOption.series[0],
          data: genreStats.map((genre) => ({
            name: genre.name,
            value: genre.count,
          })),
        },
      ],
    };
  }

  private updateDurationChart(tracks: any[]) {
    this.durationChartOption = {
      ...this.durationChartOption,
      xAxis: {
        ...this.durationChartOption.xAxis,
        data: tracks.map((track) => track.name),
      },
      series: [
        {
          ...this.durationChartOption.series[0],
          data: tracks.map((track) => track.duration_ms / 1000),
        },
      ],
    };
  }

  private calculateGenreStats(
    artists: any[]
  ): { name: string; count: number }[] {
    const genreCount: { [key: string]: number } = {};
    artists.forEach((artist) => {
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
    this.router.navigate(['/tabs/home']);
  }
}
