export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  external_urls: {
    spotify: string;
  };
  genres?: string[];
  popularity?: number;
  followers?: {
    total: number;
  };
}
