export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number | null;
      width: number | null;
    }>;
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface AudioFeatures {
  id: string;
  valence: number;
  energy: number;
  danceability: number;
  acousticness: number;
  tempo: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
}
