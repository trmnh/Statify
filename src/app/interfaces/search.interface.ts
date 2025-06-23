export interface SearchItem {
  id: string;
  name: string;
  type: 'track' | 'artist' | 'playlist' | 'album';
  uri: string;
  images?: Array<{ url: string }>;
  artists?: Array<{ name: string }>;
  album?: { name: string };
  owner?: { display_name: string };
  followers?: { total: number };
  tracks?: { total: number };
}
