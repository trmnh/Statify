import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {}
