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
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  peopleOutline,
  musicalNotesOutline,
  pieChartOutline,
  timeOutline,
  calendarOutline,
  alertCircleOutline,
  refreshOutline,
} from 'ionicons/icons';

// Ajouter les icônes
addIcons({
  arrowBackOutline,
  peopleOutline,
  musicalNotesOutline,
  pieChartOutline,
  timeOutline,
  calendarOutline,
  alertCircleOutline,
  refreshOutline,
});

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
  recentlyPlayed$ = new BehaviorSubject<any[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  // Couleurs adaptées au dark mode
  private chartColors = {
    primary: '#1DB954', // Vert Spotify
    secondary: '#1ED760', // Vert plus clair
    accent: '#FF6B6B', // Rouge accent
    tertiary: '#4ECDC4', // Turquoise
    quaternary: '#45B7D1', // Bleu
    background: '#1a1a1a', // Fond sombre
    text: '#ffffff', // Texte blanc
    textSecondary: '#b3b3b3', // Texte secondaire
    grid: '#333333', // Grille
    border: '#404040', // Bordures
  };

  artistsChartOption: any = {
    backgroundColor: this.chartColors.background,
    title: {
      text: 'Top 10 Artistes',
      left: 'center',
      textStyle: {
        color: this.chartColors.text,
        fontSize: 16,
        fontWeight: 'bold',
      },
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: this.chartColors.background,
      borderColor: this.chartColors.border,
      textStyle: {
        color: this.chartColors.text,
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(29, 185, 84, 0.1)',
        },
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 0,
        rotate: 45,
        color: this.chartColors.textSecondary,
        fontSize: 10,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      axisTick: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Popularité',
      nameTextStyle: {
        color: this.chartColors.textSecondary,
      },
      axisLabel: {
        color: this.chartColors.textSecondary,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      splitLine: {
        lineStyle: {
          color: this.chartColors.grid,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        data: [],
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: this.chartColors.primary },
              { offset: 1, color: this.chartColors.secondary },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: this.chartColors.secondary,
          },
        },
      },
    ],
    // Message quand pas de données
    graphic: {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: 'Aucune donnée disponible',
        fill: this.chartColors.textSecondary,
        fontSize: 14,
      },
      silent: true,
    },
  };

  tracksChartOption: any = {
    backgroundColor: this.chartColors.background,
    title: {
      text: 'Top 10 Pistes',
      left: 'center',
      textStyle: {
        color: this.chartColors.text,
        fontSize: 16,
        fontWeight: 'bold',
      },
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: this.chartColors.background,
      borderColor: this.chartColors.border,
      textStyle: {
        color: this.chartColors.text,
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(255, 107, 107, 0.1)',
        },
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 0,
        rotate: 45,
        color: this.chartColors.textSecondary,
        fontSize: 10,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      axisTick: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Popularité',
      nameTextStyle: {
        color: this.chartColors.textSecondary,
      },
      axisLabel: {
        color: this.chartColors.textSecondary,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      splitLine: {
        lineStyle: {
          color: this.chartColors.grid,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        data: [],
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: this.chartColors.accent },
              { offset: 1, color: '#FF8E8E' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#FF8E8E',
          },
        },
      },
    ],
  };

  genresChartOption: any = {
    backgroundColor: this.chartColors.background,
    title: {
      text: 'Distribution des Genres',
      left: 'center',
      textStyle: {
        color: this.chartColors.text,
        fontSize: 16,
        fontWeight: 'bold',
      },
      top: 10,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: this.chartColors.background,
      borderColor: this.chartColors.border,
      textStyle: {
        color: this.chartColors.text,
      },
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: {
        color: this.chartColors.textSecondary,
        fontSize: 11,
      },
      data: [],
    },
    series: [
      {
        name: 'Genres',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [],
        itemStyle: {
          borderRadius: 6,
          borderColor: this.chartColors.background,
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        color: [
          this.chartColors.primary,
          this.chartColors.secondary,
          this.chartColors.accent,
          this.chartColors.tertiary,
          this.chartColors.quaternary,
          '#FFD93D',
          '#6BCF7F',
          '#4D96FF',
          '#9B59B6',
          '#E67E22',
        ],
      },
    ],
  };

  durationChartOption: any = {
    backgroundColor: this.chartColors.background,
    title: {
      text: 'Durée des Pistes',
      left: 'center',
      textStyle: {
        color: this.chartColors.text,
        fontSize: 16,
        fontWeight: 'bold',
      },
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: this.chartColors.background,
      borderColor: this.chartColors.border,
      textStyle: {
        color: this.chartColors.text,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: [],
      name: 'Pistes',
      nameTextStyle: {
        color: this.chartColors.textSecondary,
      },
      axisLabel: {
        interval: 0,
        rotate: 45,
        color: this.chartColors.textSecondary,
        fontSize: 10,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      axisTick: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Durée (secondes)',
      nameTextStyle: {
        color: this.chartColors.textSecondary,
      },
      axisLabel: {
        color: this.chartColors.textSecondary,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      splitLine: {
        lineStyle: {
          color: this.chartColors.grid,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        data: [],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: this.chartColors.tertiary,
          width: 3,
        },
        itemStyle: {
          color: this.chartColors.tertiary,
          borderColor: this.chartColors.background,
          borderWidth: 2,
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
                color: 'rgba(78, 205, 196, 0.6)',
              },
              {
                offset: 1,
                color: 'rgba(78, 205, 196, 0.1)',
              },
            ],
          },
        },
      },
    ],
  };

  activityChartOption: any = {
    backgroundColor: this.chartColors.background,
    title: {
      text: "Activité d'écoute par heure",
      left: 'center',
      textStyle: {
        color: this.chartColors.text,
        fontSize: 16,
        fontWeight: 'bold',
      },
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: this.chartColors.background,
      borderColor: this.chartColors.border,
      textStyle: {
        color: this.chartColors.text,
      },
      formatter: function (params: any) {
        const data = params[0];
        return `${data.name}h<br/>${data.value} morceaux écoutés`;
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(255, 193, 7, 0.1)',
        },
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}h`),
      name: 'Heure de la journée',
      nameTextStyle: {
        color: this.chartColors.textSecondary,
      },
      axisLabel: {
        color: this.chartColors.textSecondary,
        fontSize: 10,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      axisTick: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Nombre de morceaux',
      nameTextStyle: {
        color: this.chartColors.textSecondary,
      },
      axisLabel: {
        color: this.chartColors.textSecondary,
      },
      axisLine: {
        lineStyle: {
          color: this.chartColors.grid,
        },
      },
      splitLine: {
        lineStyle: {
          color: this.chartColors.grid,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        data: Array.from({ length: 24 }, () => 0),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#FFC107' }, // Jaune
              { offset: 1, color: '#FF9800' }, // Orange
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#FF9800',
          },
        },
      },
    ],
    graphic: {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: 'Aucune donnée disponible',
        fill: this.chartColors.textSecondary,
        fontSize: 14,
      },
      silent: true,
    },
  };

  constructor() {}

  ngOnInit() {
    this.selectedPeriodControl.valueChanges
      .pipe(
        startWith(this.selectedPeriodControl.value),
        switchMap((period) => {
          this.loading$.next(true);
          this.error$.next(null);
          console.log('Chargement des données pour la période:', period);

          return combineLatest([
            this.userService.getTopArtists(10, period!),
            this.userService.getTopTracks(20, period!),
            this.userService.getRecentlyPlayed(50),
          ]);
        })
      )
      .subscribe({
        next: ([artists, tracks, recentlyPlayed]) => {
          console.log('Données reçues:', {
            artists: artists?.length || 0,
            tracks: tracks?.length || 0,
            recentlyPlayed: recentlyPlayed?.length || 0,
            sampleArtist: artists?.[0],
            sampleTrack: tracks?.[0],
            sampleRecentlyPlayed: recentlyPlayed?.[0],
          });

          this.topArtists$.next(artists || []);
          this.topTracks$.next(tracks || []);
          this.recentlyPlayed$.next(recentlyPlayed || []);
          this.loading$.next(false);
          this.updateCharts();
        },
        error: (error) => {
          console.error('Erreur lors du chargement:', error);

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
    const artists = this.topArtists$.value;
    const tracks = this.topTracks$.value;
    const recentlyPlayed = this.recentlyPlayed$.value;

    console.log('Mise à jour des graphiques:', {
      artists: artists?.length || 0,
      tracks: tracks?.length || 0,
      recentlyPlayed: recentlyPlayed?.length || 0,
    });

    this.updateArtistsChart(artists);
    this.updateTracksChart(tracks);
    this.updateGenresChart(artists);
    this.updateDurationChart(tracks);
    this.updateActivityChart(recentlyPlayed);
  }

  // Méthode pour forcer la mise à jour des graphiques
  forceChartUpdate() {
    console.log('Forçage de la mise à jour des graphiques');
    this.updateCharts();
  }

  private updateArtistsChart(artists: any[]) {
    if (!artists || artists.length === 0) {
      console.log('Aucun artiste trouvé');
      this.artistsChartOption = {
        ...this.artistsChartOption,
        xAxis: {
          ...this.artistsChartOption.xAxis,
          data: [],
        },
        series: [
          {
            ...this.artistsChartOption.series[0],
            data: [],
          },
        ],
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'Aucun artiste trouvé',
            fill: this.chartColors.textSecondary,
            fontSize: 14,
          },
          silent: true,
        },
      };
      return;
    }

    console.log('Mise à jour graphique artistes:', artists.length, 'artistes');

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
      graphic: undefined, // Supprimer le message si on a des données
    };
  }

  private updateTracksChart(tracks: any[]) {
    if (!tracks || tracks.length === 0) {
      console.log('Aucune piste trouvée');
      this.tracksChartOption = {
        ...this.tracksChartOption,
        xAxis: {
          ...this.tracksChartOption.xAxis,
          data: [],
        },
        series: [
          {
            ...this.tracksChartOption.series[0],
            data: [],
          },
        ],
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'Aucune piste trouvée',
            fill: this.chartColors.textSecondary,
            fontSize: 14,
          },
          silent: true,
        },
      };
      return;
    }

    console.log('Mise à jour graphique pistes:', tracks.length, 'pistes');

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
      graphic: undefined,
    };
  }

  private updateGenresChart(artists: any[]) {
    if (!artists || artists.length === 0) return;

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
    if (!tracks || tracks.length === 0) return;

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
      if (artist.genres && Array.isArray(artist.genres)) {
        artist.genres.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });

    return Object.entries(genreCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private updateActivityChart(recentlyPlayed: any[]) {
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
      console.log("Aucune activité d'écoute trouvée");
      this.activityChartOption = {
        ...this.activityChartOption,
        series: [
          {
            ...this.activityChartOption.series[0],
            data: Array.from({ length: 24 }, () => 0),
          },
        ],
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: "Aucune activité d'écoute trouvée",
            fill: this.chartColors.textSecondary,
            fontSize: 14,
          },
          silent: true,
        },
      };
      return;
    }

    console.log(
      'Mise à jour graphique activité:',
      recentlyPlayed.length,
      'écoutes'
    );

    const activityStats = this.calculateActivityStats(recentlyPlayed);
    console.log("Statistiques d'activité:", activityStats);

    this.activityChartOption = {
      ...this.activityChartOption,
      series: [
        {
          ...this.activityChartOption.series[0],
          data: activityStats.map((activity) => activity.value),
        },
      ],
      graphic: undefined,
    };
  }

  private calculateActivityStats(
    recentlyPlayed: any[]
  ): { name: string; value: number }[] {
    // Initialiser un tableau avec 24 heures (0-23) avec des valeurs à 0
    const activityCount: { [key: string]: number } = {};
    for (let i = 0; i < 24; i++) {
      activityCount[i.toString().padStart(2, '0')] = 0;
    }

    // Compter les écoutes par heure
    recentlyPlayed.forEach((activity) => {
      if (activity.played_at) {
        const playedAt = new Date(activity.played_at);
        const hour = playedAt.getHours().toString().padStart(2, '0');
        activityCount[hour] = (activityCount[hour] || 0) + 1;
      }
    });

    // Convertir en tableau et trier par heure
    return Object.entries(activityCount)
      .map(([hour, count]) => ({
        name: `${hour}h`,
        value: count,
      }))
      .sort((a, b) => {
        const hourA = parseInt(a.name.replace('h', ''));
        const hourB = parseInt(b.name.replace('h', ''));
        return hourA - hourB;
      });
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }
}
