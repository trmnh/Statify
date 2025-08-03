export interface StreamingEntry {
  ts: string; // Horodatage ISO
  ms_played: number; // Durée en millisecondes
  master_metadata_track_name: string; // Nom de la piste
  master_metadata_album_artist_name: string; // Nom de l'artiste
  platform: string; // Plateforme (Android, iOS, etc.)
  skipped: boolean; // Si la piste a été passée
  master_metadata_album_album_name?: string; // Nom de l'album (optionnel)
  spotify_track_uri?: string; // URI Spotify de la piste (optionnel)
  reason_start?: string; // Raison du début de lecture (optionnel)
  reason_end?: string; // Raison de la fin de lecture (optionnel)
  shuffle?: boolean; // Mode aléatoire (optionnel)
  offline?: boolean; // Mode hors ligne (optionnel)
  incognito_mode?: boolean; // Mode incognito (optionnel)
}

export interface StreamingStats {
  totalListeningHours: number;
  totalTracks: number;
  uniqueArtists: number;
  averageTrackDuration: number;
  topArtists: Array<{ name: string; count: number; totalMs: number }>;
  topTracks: Array<{
    name: string;
    artist: string;
    count: number;
    totalMs: number;
  }>;
  activityByHour: Array<{ hour: number; count: number }>;
  activityByDay: Array<{ day: string; count: number }>;
  monthlyActivity: Array<{ month: string; count: number; totalMs: number }>;
}
