import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-popover',
  standalone: true,
  template: `
    <ion-list>
      <ion-item button (click)="logout()">
        <ion-icon name="log-out-outline" slot="start"></ion-icon>
        <ion-label>Déconnexion</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: [`
    ion-list {
      padding: 0;
    }
    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --min-height: 48px;
    }
  `],
  imports: [CommonModule, IonicModule]
})
export class ProfilePopoverComponent {
  constructor(
    private popoverCtrl: PopoverController,
    private router: Router
  ) {}

  async logout() {
    localStorage.removeItem('spotifyToken');
    localStorage.removeItem('tokenExpiry');
    await this.popoverCtrl.dismiss();
    this.router.navigate(['/login']);
  }
} 