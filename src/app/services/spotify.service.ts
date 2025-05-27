import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  get token(): string | null {
    return localStorage.getItem('spotifyToken');
  }

  isTokenValid(): boolean {
    return !!this.token;
  }

  async search(query: string, type: 'track' | 'artist' | 'album' = 'track') {
    if (!this.token) return [];

    const res = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return res.data[`${type}s`].items;
  }

  async getUserProfile() {
    if (!this.token) return null;

    try {
      const res = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('spotifyToken');
        window.location.href = '/login';
      }
      throw err;
    }
  }

  async getTopArtists() {
    if (!this.token) return [];

    const res = await axios.get(
      `https://api.spotify.com/v1/me/top/artists?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return res.data.items;
  }

  async getTopTracks() {
    if (!this.token) return [];

    const res = await axios.get(
      `https://api.spotify.com/v1/me/top/tracks?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return res.data.items;
  }
  async getUserPlaylists(limit = 3) {
    if (!this.token) return [];

    const res = await axios.get(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    return res.data.items;
  }

  async createTopTracksPlaylist() {
    if (!this.token) return;

    const userRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    const userId = userRes.data.id;

    const topTracksRes = await axios.get(
      'https://api.spotify.com/v1/me/top/tracks?limit=10',
      {
        headers: { Authorization: `Bearer ${this.token}` },
      }
    );

    const uris = topTracksRes.data.items.map((track: any) => track.uri);

    const playlistRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: 'Test playlist des 10 top titres',
        description: 'Playlist générée automatiquement depuis Statify',
        public: false,
      },
      {
        headers: { Authorization: `Bearer ${this.token}` },
      }
    );

    const playlistId = playlistRes.data.id;

    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { uris },
      {
        headers: { Authorization: `Bearer ${this.token}` },
      }
    );

    return playlistRes.data;
  }
}
