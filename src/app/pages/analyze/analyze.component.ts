import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { BehaviorSubject } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  musicalNotesOutline,
  peopleOutline,
  statsChartOutline,
  refreshOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  cloudDownloadOutline,
  trashOutline,
} from 'ionicons/icons';
import { UploadZipComponent } from '../../components/upload-zip/upload-zip.component';
import { SpotifyZipParserService } from '../../services/spotify-zip-parser.service';
import {
  StreamingEntry,
  StreamingStats,
} from '../../interfaces/streaming-entry.interface';
import { MonthlyListeningChartComponent } from '../../components/charts/monthly-listening-chart.component';
import { TopArtistsCardsComponent } from '../../components/charts/top-artists-cards.component';
import { ActivityChartComponent } from '../../components/charts/activity-chart.component';
import { SkippedTopArtistsChartComponent } from '../../components/charts/skipped-top-artists-chart.component';
import { SkippedRatioChartComponent } from '../../components/charts/skipped-ratio-chart.component';
import { DurationChartComponent } from '../../components/charts/duration-chart.component';
import { TopTracksCardsComponent } from '../../components/charts/top-tracks-cards.component';

@Component({
  selector: 'app-analyze',
  standalone: true,
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.scss'],
  imports: [
    IonicModule,
    CommonModule,
    NgxEchartsModule,
    UploadZipComponent,
    MonthlyListeningChartComponent,
    TopArtistsCardsComponent,
    ActivityChartComponent,
    SkippedTopArtistsChartComponent,
    SkippedRatioChartComponent,
    DurationChartComponent,
    TopTracksCardsComponent,
  ],
})
export class AnalyzeComponent implements OnInit {
  private router = inject(Router);
  private zipParserService = inject(SpotifyZipParserService);

  // États
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  hasData$ = new BehaviorSubject<boolean>(false);

  // Données
  streamingEntries$ = new BehaviorSubject<StreamingEntry[]>([]);
  stats$ = new BehaviorSubject<StreamingStats | null>(null);

  constructor() {
    addIcons({
      timeOutline,
      musicalNotesOutline,
      peopleOutline,
      statsChartOutline,
      refreshOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      cloudDownloadOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    // Pas de chargement automatique
  }

  onFileUploaded(file: File) {
    this.loading$.next(true);
    this.error$.next(null);

    this.zipParserService.parseZip(file).subscribe({
      next: (entries) => {
        console.log('Données extraites:', entries.length, 'entrées');
        this.streamingEntries$.next(entries);

        const stats = this.zipParserService.calculateStats(entries);
        this.stats$.next(stats);

        this.hasData$.next(true);
        this.loading$.next(false);
      },
      error: (error) => {
        console.error('Erreur lors du parsing:', error);
        this.error$.next("Erreur lors de l'analyse du fichier ZIP");
        this.loading$.next(false);
      },
    });
  }

  onUploadError(error: string) {
    this.error$.next(error);
  }

  resetAnalysis() {
    this.streamingEntries$.next([]);
    this.stats$.next(null);
    this.hasData$.next(false);
    this.error$.next(null);
    this.loading$.next(false);
  }
}
