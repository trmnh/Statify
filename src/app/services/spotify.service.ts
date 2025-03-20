import axios from 'axios';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private token: string | null = localStorage.getItem("spotifyToken");

  constructor() {
    this.checkToken();
  }

  async checkToken() {
    if (!this.token) {
      console.error("🔴 Pas de token ! L'utilisateur doit se reconnecter.");
    }
  }

  async searchTracks(query: string) {
    if (!this.token) return [];

    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );

    return response.data.tracks.items;
  }
  
  async getTopArtists() {
    if (!this.token) return [];
  
    const response = await axios.get(
      `https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term`, // 🏆 Top 10 artistes
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
  
    return response.data.items;
  }
  
  async getTopTracks() {
    if (!this.token) return [];
  
    const response = await axios.get(
      `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term`, // 🏆 Top 10 musiques
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
  
    return response.data.items;
  }
  
}
