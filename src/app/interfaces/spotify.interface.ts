export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  external_urls: {
    spotify: string;
  };
  tracks: {
    total: number;
    items: Array<{
      track: {
        id: string;
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
        preview_url: string | null;
        external_urls: {
          spotify: string;
        };
      };
    }>;
  };
}

export interface SpotifyProfile {
  id: string;
  display_name: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  external_urls: {
    spotify: string;
  };
} 