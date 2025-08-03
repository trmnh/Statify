import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import {
  StreamingEntry,
  StreamingStats,
} from '../interfaces/streaming-entry.interface';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SpotifyZipParserService {
  constructor() {}

  /**
   * Parse un fichier ZIP Spotify et extrait les données d'écoute
   */
  parseZip(file: File): Observable<StreamingEntry[]> {
    return from(this.extractAndParseZip(file)).pipe(
      catchError((error) => {
        console.error('Erreur lors du parsing du ZIP:', error);
        return throwError(
          () => new Error('Erreur lors du parsing du fichier ZIP')
        );
      })
    );
  }

  /**
   * Valide que le fichier ZIP contient les bonnes données Spotify
   */
  validateZipFile(file: File): Observable<boolean> {
    return from(this.validateZipContent(file)).pipe(
      catchError((error) => {
        console.error('Erreur lors de la validation du ZIP:', error);
        return of(false);
      })
    );
  }

  /**
   * Calcule les statistiques à partir des données d'écoute
   */
  calculateStats(entries: StreamingEntry[]): StreamingStats {
    if (!entries || entries.length === 0) {
      return this.getEmptyStats();
    }

    // Filtrer les entrées valides (non passées et avec une durée > 0)
    const validEntries = entries.filter(
      (entry) =>
        !entry.skipped &&
        entry.ms_played > 0 &&
        entry.master_metadata_track_name
    );

    // Calculs de base
    const totalMs = validEntries.reduce(
      (sum, entry) => sum + entry.ms_played,
      0
    );
    const totalListeningHours = totalMs / (1000 * 60 * 60);
    const totalTracks = validEntries.length;
    const uniqueArtists = new Set(
      validEntries.map((entry) => entry.master_metadata_album_artist_name)
    ).size;
    const averageTrackDuration = totalMs / totalTracks;

    // Top artistes
    const artistStats = this.calculateArtistStats(validEntries);
    const topArtists = artistStats
      .sort((a, b) => b.totalMs - a.totalMs)
      .slice(0, 10);

    // Top pistes
    const trackStats = this.calculateTrackStats(validEntries);
    const topTracks = trackStats
      .sort((a, b) => b.totalMs - a.totalMs)
      .slice(0, 10);

    // Activité par heure
    const activityByHour = this.calculateActivityByHour(validEntries);

    // Activité par jour
    const activityByDay = this.calculateActivityByDay(validEntries);

    // Activité mensuelle
    const monthlyActivity = this.calculateMonthlyActivity(validEntries);

    return {
      totalListeningHours,
      totalTracks,
      uniqueArtists,
      averageTrackDuration,
      topArtists,
      topTracks,
      activityByHour,
      activityByDay,
      monthlyActivity,
    };
  }

  /**
   * Calcule le temps total d'écoute en heures
   */
  calculateTotalListeningHours(entries: StreamingEntry[]): number {
    const validEntries = entries.filter(
      (entry) => !entry.skipped && entry.ms_played > 0
    );
    const totalMs = validEntries.reduce(
      (sum, entry) => sum + entry.ms_played,
      0
    );
    return totalMs / (1000 * 60 * 60);
  }

  /**
   * Sauvegarde les données d'analyse dans localStorage
   */

  private async extractAndParseZip(file: File): Promise<StreamingEntry[]> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    const streamingEntries: StreamingEntry[] = [];

    // Rechercher les fichiers Streaming_History_Audio_*.json
    const streamingFiles = Object.keys(zipContent.files).filter(
      (filename) =>
        filename.includes('Streaming_History_Audio_') &&
        filename.endsWith('.json')
    );

    if (streamingFiles.length === 0) {
      throw new Error("Aucun fichier de données d'écoute trouvé dans le ZIP");
    }

    // Parser chaque fichier
    for (const filename of streamingFiles) {
      const fileContent = await zipContent.file(filename)?.async('string');
      if (fileContent) {
        try {
          const jsonData = JSON.parse(fileContent);
          if (Array.isArray(jsonData)) {
            streamingEntries.push(...jsonData);
          }
        } catch (error) {
          console.warn(`Erreur lors du parsing du fichier ${filename}:`, error);
        }
      }
    }

    // Trier par horodatage (plus récent en premier)
    streamingEntries.sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );

    return streamingEntries;
  }

  private async validateZipContent(file: File): Promise<boolean> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    const streamingFiles = Object.keys(zipContent.files).filter(
      (filename) =>
        filename.includes('Streaming_History_Audio_') &&
        filename.endsWith('.json')
    );

    return streamingFiles.length > 0;
  }

  private calculateArtistStats(
    entries: StreamingEntry[]
  ): Array<{ name: string; count: number; totalMs: number }> {
    const artistMap = new Map<string, { count: number; totalMs: number }>();

    entries.forEach((entry) => {
      const artistName = entry.master_metadata_album_artist_name;
      if (artistName) {
        const existing = artistMap.get(artistName) || { count: 0, totalMs: 0 };
        artistMap.set(artistName, {
          count: existing.count + 1,
          totalMs: existing.totalMs + entry.ms_played,
        });
      }
    });

    return Array.from(artistMap.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      totalMs: stats.totalMs,
    }));
  }

  private calculateTrackStats(
    entries: StreamingEntry[]
  ): Array<{ name: string; artist: string; count: number; totalMs: number }> {
    const trackMap = new Map<
      string,
      { artist: string; count: number; totalMs: number }
    >();

    entries.forEach((entry) => {
      const trackName = entry.master_metadata_track_name;
      const artistName = entry.master_metadata_album_artist_name;

      if (trackName && artistName) {
        const key = `${trackName} - ${artistName}`;
        const existing = trackMap.get(key) || {
          artist: artistName,
          count: 0,
          totalMs: 0,
        };
        trackMap.set(key, {
          artist: artistName,
          count: existing.count + 1,
          totalMs: existing.totalMs + entry.ms_played,
        });
      }
    });

    return Array.from(trackMap.entries()).map(([name, stats]) => ({
      name: name.split(' - ')[0],
      artist: stats.artist,
      count: stats.count,
      totalMs: stats.totalMs,
    }));
  }

  private calculateActivityByHour(
    entries: StreamingEntry[]
  ): Array<{ hour: number; count: number }> {
    const hourMap = new Map<number, number>();

    // Initialiser toutes les heures avec 0
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, 0);
    }

    entries.forEach((entry) => {
      const date = new Date(entry.ts);
      const hour = date.getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    return Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);
  }

  private calculateActivityByDay(
    entries: StreamingEntry[]
  ): Array<{ day: string; count: number }> {
    const dayMap = new Map<string, number>();
    const dayNames = [
      'Dimanche',
      'Lundi',
      'Mardi',
      'Mercredi',
      'Jeudi',
      'Vendredi',
      'Samedi',
    ];

    entries.forEach((entry) => {
      const date = new Date(entry.ts);
      const dayName = dayNames[date.getDay()];
      dayMap.set(dayName, (dayMap.get(dayName) || 0) + 1);
    });

    return Array.from(dayMap.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => {
        const dayOrder = [
          'Lundi',
          'Mardi',
          'Mercredi',
          'Jeudi',
          'Vendredi',
          'Samedi',
          'Dimanche',
        ];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      });
  }

  private calculateMonthlyActivity(
    entries: StreamingEntry[]
  ): Array<{ month: string; count: number; totalMs: number }> {
    const monthMap = new Map<string, { count: number; totalMs: number }>();
    const monthNames = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];

    entries.forEach((entry) => {
      const date = new Date(entry.ts);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];

      const existing = monthMap.get(monthKey) || { count: 0, totalMs: 0 };
      monthMap.set(monthKey, {
        count: existing.count + 1,
        totalMs: existing.totalMs + entry.ms_played,
      });
    });

    return Array.from(monthMap.entries())
      .map(([key, stats]) => {
        const [year, month] = key.split('-');
        const monthName = monthNames[parseInt(month)];
        return {
          month: `${monthName} ${year}`,
          count: stats.count,
          totalMs: stats.totalMs,
        };
      })
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        const yearDiff = parseInt(yearA) - parseInt(yearB);
        if (yearDiff !== 0) return yearDiff;
        return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
      });
  }

  private getEmptyStats(): StreamingStats {
    return {
      totalListeningHours: 0,
      totalTracks: 0,
      uniqueArtists: 0,
      averageTrackDuration: 0,
      topArtists: [],
      topTracks: [],
      activityByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
      })),
      activityByDay: [],
      monthlyActivity: [],
    };
  }
}
