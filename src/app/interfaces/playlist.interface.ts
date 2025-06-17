import { SpotifyTrack } from './track.interface';

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
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
    items: Array<{
      track: SpotifyTrack;
    }>;
  };
  public: boolean;
  collaborative: boolean;
}
